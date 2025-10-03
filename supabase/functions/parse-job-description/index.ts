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

    console.log('Parsing job description with AI...');

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
            content: `You are an expert at mapping job descriptions into structured fields. Apply STRICT mapping and concise output.\n\nSection mapping:\n- Job Title: extract EXACT title from the first heading or explicit 'Job Title:' line; do not reword.\n- Industry: infer concise domain (Software/Tech, Biotech/Healthcare, Finance/Fintech, Energy/Cleantech, Public/Non-profit).\n- Seniority: choose highest single level mentioned (junior/mid/senior/lead/exec); use thresholds (0–2y=junior, 3–5y=mid, 5–7y=senior, 8–9y=lead, 10+y=exec).\n- Employment Type: map Full-time/Part-time/Contract/Temporary to full_time/contract/temp.\n- Location Type: map On-site/Hybrid/Remote to on_site/hybrid/remote. If 'Hybrid' and a city appears, set location_type=hybrid and location=<City>.\n- Compensation: extract currency and numeric min/max when present.\n\nRole Description:\n- 1–3 sentences summarizing mission and responsibilities (sections like 'Your Mission', 'What You’ll Do').\n- Keep concise, no filler.\n- Include benefits only as part of narrative if they appear; DO NOT move benefits into skills.\n- REMOVE legal/EEO/compliance text.\n\nSkills:\n- Must-Have Skills: from 'Requirements'/'What You’ll Bring'. Prefer hard skills (stack, cloud, CI/CD, security). Max 6 items.\n- Nice-to-Have Skills: from 'Bonus'/'Preferred'/'Plus'/'Nice to have'. Max 4 items.\n- Trim phrasing by removing fillers ('Experience with', 'Strong', 'Proficiency in', etc.).\n- Normalize tech names (e.g., 'JavaScript/TypeScript', 'React', 'Node.js', 'GCP/AWS', 'CI/CD', 'GraphQL').\n- Each bullet ≤ 10 words.\n- Deduplicate and trim; exclude benefits/perks/legal.\n\nGeneral:\n- Ignore EEO/legal statements entirely for description and skills.\n- Keep arrays concise and clean.`
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
                    description: 'The specific location if on-site or hybrid (e.g., Tel Aviv, New York)'
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

    function cleanList(arr?: string[], cap = 6) {
      const seen = new Set<string>();
      const cleaned: string[] = [];
      for (const item of arr ?? []) {
        const x = limitWords(normalizeTech(stripFiller(String(item))), 10);
        const key = x.toLowerCase();
        if (x && !seen.has(key)) {
          seen.add(key);
          cleaned.push(x);
        }
        if (cleaned.length === cap) break;
      }
      return cleaned;
    }

    // Description: remove EEO/legal common lines, compress to 3 sentences
    function cleanDescription(desc?: string) {
      if (!desc) return '';
      let d = desc
        .replace(/equal opportunity.*?(\.|\n)/gi, '')
        .replace(/accommodations.*?(\.|\n)/gi, '')
        .replace(/(disability|veteran)s?.*?(\.|\n)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      const parts = d.split(/(?<=\.)\s+/).slice(0, 3);
      return parts.join(' ');
    }

    const jobInfo: any = {
      ...raw,
      description: cleanDescription(raw.description),
      skills_must: cleanList(raw.skills_must, 6),
      skills_nice: cleanList(raw.skills_nice, 4),
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
