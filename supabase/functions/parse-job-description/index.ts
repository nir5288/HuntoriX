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
            content: 'You are an expert at mapping job descriptions into structured fields. Rules: 1) Job Title: extract EXACT title text from the first heading or an explicit "Job Title" field; do not reword. 2) Industry: infer domain such as Software/Tech, Biotech/Healthcare, Finance/Fintech, Energy/Cleantech, Public/Non-profit. 3) Seniority: detect Junior/Mid/Senior/Lead/Exec using title keywords and experience thresholds (0-2y=juni, 2-5y=mid, 5-7y=senior, 8-9y=lead, 10+y=exec). 4) Employment Type: map Full-time/Part-time/Contract/Temporary to full_time/contract/temp. 5) Location Type: map On-site/Hybrid/Remote to on_site/hybrid/remote. 6) Compensation: extract currency and numeric min/max if any. 7) Role Description: include mission, summary, and responsibilities sections like "Your Mission", "What You’ll Do". Do NOT include benefits, perks, or legal/EEO text here. 8) Must-Have Skills: take from sections named "Requirements", "What You’ll Bring", strictly core qualifications; exclude benefits/perks. 9) Nice-to-Have Skills: take from "Bonus Points"/"Nice to Have". 10) Ignore EEO/legal compliance statements entirely for description and skills. Keep arrays concise, deduplicated, and trimmed.'
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

    const jobInfo = JSON.parse(toolCall.function.arguments);
    console.log('Extracted job info:', jobInfo);

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
