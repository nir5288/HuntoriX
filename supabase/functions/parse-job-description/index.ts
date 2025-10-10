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

    console.log('Parsing job description with GPT-5...');

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

SKILLS (EXTRACT ALL - THEY WILL BE PROCESSED):
- Must-Have: Extract ALL technical and core skills from "Requirements", "Must Have", or "Essential" sections
- Nice-to-Have: Extract ALL from "Preferred", "Bonus", "Nice-to-Have", "Advantage", or "Plus" sections
- Include technologies, frameworks, languages, tools, methodologies
- Include up to 3 soft skills per list (communication, collaboration, proactive, etc.) - list these LAST
- Extract skills exactly as written - they will be standardized automatically
- Minimum: At least 1 must-have skill required
- Extract ALL skills mentioned - no artificial limits

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

    // Step 1: Remove filler words
    function stripFiller(s: string) {
      let cleaned = s
        .replace(/^(strong|proven|solid|excellent|good|hands?-on|deep|extensive)\s+/gi, '')
        .replace(/^(experience with|proficiency in|expertise in|knowledge of|familiarity with|understanding of|ability to|skilled in)\s+/gi, '')
        .replace(/\s+(experience|skills?|proficiency)$/gi, '')
        .trim();
      return cleaned;
    }

    // Step 2: Canonicalize - map synonyms to standard terms
    function canonicalize(s: string): string {
      const lower = s.toLowerCase();
      
      // Cloud Providers
      if (/\b(amazon web services|amazon aws|aws cloud)\b/i.test(lower)) return 'AWS';
      if (/\b(google cloud platform|google cloud|gcp)\b/i.test(lower)) return 'GCP';
      if (/\b(microsoft azure|azure cloud)\b/i.test(lower)) return 'Azure';
      
      // Languages
      if (/\b(javascript|js)\b/i.test(lower) && !/typescript/i.test(lower)) return 'JavaScript';
      if (/\b(typescript|ts)\b/i.test(lower)) return 'TypeScript';
      if (/\b(python[0-9.]*)\b/i.test(lower)) return 'Python';
      if (/\b(java)\b/i.test(lower) && !/javascript/i.test(lower)) return 'Java';
      if (/\b(golang|go lang)\b/i.test(lower)) return 'Go';
      
      // Frameworks/Libraries
      if (/\b(reactjs|react\.js)\b/i.test(lower)) return 'React';
      if (/\b(nodejs|node\.js|node)\b/i.test(lower)) return 'Node.js';
      if (/\b(expressjs|express\.js)\b/i.test(lower)) return 'Express';
      if (/\b(nextjs|next\.js)\b/i.test(lower)) return 'Next.js';
      if (/\b(spring boot framework)\b/i.test(lower)) return 'Spring Boot';
      if (/\b(angular(?:js)?)\b/i.test(lower)) return 'Angular';
      if (/\b(vue(?:\.js)?)\b/i.test(lower)) return 'Vue';
      
      // APIs & Architecture
      if (/\b(restful apis?|rest apis?)\b/i.test(lower)) return 'REST APIs';
      if (/\b(graphql)\b/i.test(lower)) return 'GraphQL';
      if (/\b(micro-?services?|microservice architecture)\b/i.test(lower)) return 'Microservices';
      if (/\b(serverless)\b/i.test(lower)) return 'Serverless';
      
      // Containers/DevOps
      if (/\b(k8s)\b/i.test(lower)) return 'Kubernetes';
      if (/\b(kubernetes|k8s)\b/i.test(lower)) return 'Kubernetes';
      if (/\b(docker containers?)\b/i.test(lower)) return 'Docker';
      if (/\b(ci\/?cd|continuous integration.*delivery|jenkins ci)\b/i.test(lower)) return 'CI/CD';
      if (/\b(jenkins)\b/i.test(lower) && !/ci/i.test(lower)) return 'Jenkins';
      if (/\b(infrastructure as code|iac tooling?)\b/i.test(lower)) return 'IaC';
      if (/\b(hashi terraform|terraform)\b/i.test(lower)) return 'Terraform';
      if (/\b(github actions?)\b/i.test(lower)) return 'GitHub Actions';
      
      // Databases
      if (/\b(mysql db|mysql database)\b/i.test(lower)) return 'MySQL';
      if (/\b(mongodb|mongo db|mongo)\b/i.test(lower)) return 'MongoDB';
      if (/\b(postgresql|postgres)\b/i.test(lower)) return 'PostgreSQL';
      if (/\b(sql databases?|relational databases?)\b/i.test(lower)) return 'SQL Databases';
      if (/\b(nosql databases?|no sql)\b/i.test(lower)) return 'NoSQL Databases';
      if (/\b(redis cache|redis)\b/i.test(lower)) return 'Redis';
      
      // Serverless
      if (/\b(lambda functions?|aws lambda functions?)\b/i.test(lower)) return 'AWS Lambda';
      
      // Security/Monitoring
      if (/\b(application security|appsec)\b/i.test(lower)) return 'Application Security';
      if (/\b(monitoring (?:and|&) logging)\b/i.test(lower)) return 'Monitoring, Logging';
      
      // General Skills
      if (/\b(system design principles?)\b/i.test(lower)) return 'System Design';
      if (/\b(data structures?(?: and| &) algorithms?)\b/i.test(lower)) return 'Data Structures';
      if (/\b(performance tuning|optimization)\b/i.test(lower)) return 'Optimization';
      if (/\b(troubleshooting (?:and|&) debugging)\b/i.test(lower)) return 'Debugging';
      if (/\b(debugging)\b/i.test(lower)) return 'Debugging';
      
      // Soft Skills (shorten)
      if (/\b(strong communication skills?|communication skills?)\b/i.test(lower)) return 'Communication';
      if (/\b(team player|collaboration|teamwork)\b/i.test(lower)) return 'Collaboration';
      if (/\b(self[- ]?starter|proactive)\b/i.test(lower)) return 'Proactive';
      
      // No match - return original but shortened to max 3 words
      const words = s.split(/\s+/);
      if (words.length > 3) {
        return words.slice(0, 3).join(' ');
      }
      return s;
    }

    // Step 3: Title Case (preserve acronyms)
    function toTitleCase(s: string): string {
      // If it's an acronym (all caps or contains .), keep as-is
      if (/^[A-Z/.]+$/.test(s) || s.includes('.')) return s;
      
      // Otherwise title case
      return s.split(' ').map(word => {
        if (/^[A-Z]+$/.test(word)) return word; // Acronym
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    }

    // Step 4: Clean and deduplicate skills list
    function cleanList(arr?: string[], maxSkills = 12) {
      const seen = new Set<string>();
      const hardSkills: string[] = [];
      const softSkills: string[] = [];
      const softSkillKeywords = ['communication', 'collaboration', 'teamwork', 'leadership', 'problem-solving', 'proactive', 'self-motivated', 'self-starter'];
      
      for (const item of arr ?? []) {
        // Strip filler, canonicalize, then format
        let cleaned = stripFiller(String(item));
        cleaned = canonicalize(cleaned);
        cleaned = toTitleCase(cleaned);
        
        const key = cleaned.toLowerCase();
        
        // Skip if empty or duplicate
        if (!cleaned || seen.has(key)) continue;
        seen.add(key);
        
        // Check if it's a soft skill
        const isSoftSkill = softSkillKeywords.some(kw => key.includes(kw));
        if (isSoftSkill) {
          softSkills.push(cleaned);
        } else {
          hardSkills.push(cleaned);
        }
      }
      
      // Limit soft skills to 3
      const limitedSoftSkills = softSkills.slice(0, 3);
      
      // Combine: hard skills first (up to maxSkills - softSkills.length), then soft skills
      const maxHard = maxSkills - limitedSoftSkills.length;
      return [...hardSkills.slice(0, maxHard), ...limitedSoftSkills];
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
      skills_must: cleanList(raw.skills_must, 12), // Max 10-12 must-have
      skills_nice: cleanList(raw.skills_nice, 8),   // Max 6-8 nice-to-have
    };
    
    // Ensure at least 1 must-have skill
    if (!jobInfo.skills_must || jobInfo.skills_must.length === 0) {
      console.warn('No must-have skills extracted - this may indicate parsing issue');
    }

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
