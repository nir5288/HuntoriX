import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobDescription } = await req.json();
    
    if (!jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Job description text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Parsing job description with Gemini...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a precise job description parser. CRITICAL RULES:

1. NEVER INVENT OR HALLUCINATE INFORMATION - Only extract what is explicitly stated in the text
2. If information is not found, return null/empty for that field
3. Extract information EXACTLY as written - do not rephrase or interpret

JOB TITLE EXTRACTION:
- Search the ENTIRE document for phrases like "looking for a [TITLE]" or "hiring a [TITLE]" or "[TITLE] position" or "[TITLE] role"
- Examples: "looking for a Junior Full-Stack Engineer" → extract "Junior Full-Stack Engineer"
- If no clear title found, return null
- NEVER make up titles based on responsibilities

SENIORITY (CRITICAL - FOLLOW THESE RULES EXACTLY):
- EXPLICIT MENTIONS OVERRIDE YEARS:
  * If title contains "Junior" → junior
  * If title contains "Senior", "Lead", "Principal", or "Architect" → senior
  * If title contains "Director", "VP", "C-level" → exec
- YEARS OF EXPERIENCE (only when no explicit mention in title):
  * 0-2 years → junior
  * 3-4 years → mid
  * 5-7 years → mid (NOT senior!)
  * 8+ years → senior
- If unclear, return null
- REMEMBER: "5+ years" = mid level, NOT senior

INDUSTRY (INFER FROM KEYWORDS):
- Software/Tech: "AI", "ML", "cloud", "infrastructure", "software", "SaaS", "platform"
- Finance/Fintech: "fintech", "payments", "finance", "banking", "trading", "crypto"
- Biotech/Healthcare: "biotech", "healthcare", "medical", "pharma", "clinical"
- Energy/Cleantech: "energy", "renewable", "cleantech", "solar", "sustainability"
- Public/Non-profit: "government", "non-profit", "NGO", "public sector"
- Cybersecurity: Treat as Software/Tech unless explicitly different
- If multiple keywords match, prioritize the most specific

LOCATION (SCAN ENTIRE DOCUMENT):
- Look EVERYWHERE in the text: "offices in [CITY]", "based in [CITY]", "located in [CITY]", "from our [CITY] office"
- ALWAYS extract in format "City, Country" (e.g., "Tel Aviv, Israel", "New York, USA", "London, UK")
- If only city mentioned, infer country from context (company HQ, currency, phone codes)
- Map work type: Remote, Hybrid, On-site → remote, hybrid, on_site
- If unclear, return null

EMPLOYMENT TYPE:
- Look for: Full-time, Part-time, Contract, Temporary
- Map to: full_time, contract, temp
- If unclear, assume full_time

DESCRIPTION (FORMAT AS BULLET POINTS):
- Extract 3-5 key responsibilities from "Key Responsibilities" or "About the role"
- Format as bullet points with "•" prefix
- Remove legal/EEO text
- Keep concise - one sentence per bullet

SKILLS (EXTRACT ALL, NOT JUST FIRST FEW):
- Must-Have: Extract ALL from "Requirements" or "What You Need" sections
- Nice-to-Have: Extract ALL from "Preferred", "Bonus", "Nice-to-Have", or "Advantage" sections
- Include both hard skills (Node.js, AWS, Python) AND soft skills (communication, teamwork) - put soft skills last
- Remove filler words like "strong", "proven", "solid"
- NO LIMITS - extract all mentioned skills

REMEMBER: Accuracy over completeness. Return null if unsure. DO NOT MAKE THINGS UP.`
          },
          {
            role: 'user',
            content: `Parse this job description with the rules above and return the structured fields. Be precise with titles and apply the section mapping accurately.\n\n${jobDescription}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_job_info',
              description: 'Extract structured job information from a job description',
              parameters: {
                type: 'object',
                properties: {
                  title: {
                    type: 'string',
                    description: 'The exact job title from the description (e.g., Senior Fullstack Engineer, Frontend Developer). Extract it precisely as written.'
                  },
                  industry: {
                    type: 'string',
                    enum: ['Software/Tech', 'Biotech/Healthcare', 'Finance/Fintech', 'Energy/Cleantech', 'Public/Non-profit'],
                    description: 'The industry category'
                  },
                  seniority: {
                    type: 'string',
                    enum: ['junior', 'mid', 'senior', 'lead', 'exec'],
                    description: 'The seniority level'
                  },
                  employment_type: {
                    type: 'string',
                    enum: ['full_time', 'contract', 'temp'],
                    description: 'The employment type'
                  },
                  location_type: {
                    type: 'string',
                    enum: ['on_site', 'hybrid', 'remote'],
                    description: 'The work location type'
                  },
                  location: {
                    type: 'string',
                    description: 'The specific location ALWAYS in "City, Country" format if on-site or hybrid (e.g., "Tel Aviv, Israel", "New York, USA", "London, UK"). Always include the country name.'
                  },
                  budget_currency: {
                    type: 'string',
                    enum: ['ILS', 'USD', 'EUR', 'GBP', 'INR'],
                    description: 'The salary currency'
                  },
                  budget_min: {
                    type: 'number',
                    description: 'Minimum salary'
                  },
                  budget_max: {
                    type: 'number',
                    description: 'Maximum salary'
                  },
                  description: {
                    type: 'string',
                    description: 'The role description and responsibilities'
                  },
                  skills_must: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Must-have skills and requirements'
                  },
                  skills_nice: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Nice-to-have skills'
                  }
                },
                required: ['title', 'description'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_job_info' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const raw = JSON.parse(toolCall.function.arguments) as any;
    const originalText: string = String(jobDescription || '');

    function stripFiller(s: string) {
      return s.replace(/^(strong|proven|solid|hands?-on|experience with|proficiency in|expertise in|knowledge of|ability to)\s+/i, '').trim();
    }

    function normalizeTech(s: string) {
      let out = s;
      const rules = [
        { re: /\bjavascript\s*\/?\s*typescript\b/i, to: 'JavaScript/TypeScript' },
        { re: /\bnode(?:\.js)?\b/i, to: 'Node.js' },
        { re: /\breact(?:\.js)?\b/i, to: 'React' },
        { re: /\b(graphql)\b/i, to: 'GraphQL' },
        { re: /\b(ci\/?cd|continuous integration(?: and)? continuous delivery)\b/i, to: 'CI/CD' },
        { re: /\bgoogle cloud|gcp\b/i, to: 'GCP' },
        { re: /\baws|amazon web services\b/i, to: 'AWS' },
      ];
      for (const r of rules) out = out.replace(r.re, r.to);
      return out.trim();
    }

    function limitWords(s: string, max = 10) {
      const words = s.split(/\s+/);
      return words.length > max ? words.slice(0, max).join(' ') : s;
    }

    function cleanList(arr?: string[]) {
      const seen = new Set<string>();
      const cleaned: string[] = [];
      // Separate hard skills and soft skills
      const hardSkills: string[] = [];
      const softSkills: string[] = [];
      const softSkillKeywords = ['communication', 'collaboration', 'teamwork', 'leadership', 'problem-solving', 'proactive', 'self-motivated'];
      
      for (const item of arr ?? []) {
        const x = limitWords(normalizeTech(stripFiller(String(item))), 10);
        const key = x.toLowerCase();
        if (x && !seen.has(key)) {
          seen.add(key);
          // Check if it's a soft skill
          const isSoftSkill = softSkillKeywords.some(kw => key.includes(kw));
          if (isSoftSkill) {
            softSkills.push(x);
          } else {
            hardSkills.push(x);
          }
        }
      }
      // Return hard skills first, then soft skills
      return [...hardSkills, ...softSkills];
    }

    // Description: remove EEO/legal, format as bullets
    function cleanDescription(desc?: string) {
      if (!desc) return '';
      let d = desc
        .replace(/equal opportunity.*?(\.|\n)/gi, '')
        .replace(/accommodations.*?(\.|\n)/gi, '')
        .replace(/(disability|veteran)s?.*?(\.|\n)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // If already has bullet points, keep them
      if (d.includes('•') || d.includes('-')) {
        return d;
      }
      
      // Split into sentences and format as bullets (max 5)
      const sentences = d.split(/(?<=\.)\s+/).filter(s => s.length > 10).slice(0, 5);
      if (sentences.length > 1) {
        return sentences.map(s => `• ${s}`).join('\n');
      }
      return d;
    }

    const jobInfo: any = {
      ...raw,
      description: cleanDescription(raw.description),
      skills_must: cleanList(raw.skills_must),
      skills_nice: cleanList(raw.skills_nice),
    };

    // Fallback: if hybrid and location missing but city in text
    if (jobInfo.location_type === 'hybrid' && !jobInfo.location) {
      const m = originalText.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g);
      if (m && m.length) {
        const city = m.find(tok => tok.split(' ').length <= 3);
        if (city) jobInfo.location = city;
      }
    }

    // Ensure employment_type mapping remains in enum
    if (jobInfo.employment_type === 'part_time') {
      jobInfo.employment_type = 'contract';
    }

    console.log('Extracted job info (post-processed):', jobInfo);

    return new Response(
      JSON.stringify({ success: true, jobInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-job-description function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
