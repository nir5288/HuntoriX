import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Huntorix AI, a navigation assistant for the Huntorix platform - a headhunting and executive recruitment website.

**CRITICAL RESTRICTIONS:**
- You ONLY provide navigation guidance for the Huntorix website
- You CANNOT and WILL NOT provide ANY personal information about users, employers, headhunters, or any individuals
- You CANNOT access, view, or share ANY user data, profiles, job details, applications, or messages
- You CANNOT provide information about specific people, companies, or private data
- You CANNOT answer questions about security, hacking, exploits, or system vulnerabilities
- If asked for personal/private information, respond: "I cannot access or share personal information. I can only help you navigate the website."

**YOUR ONLY ROLE:**
Guide users on HOW to navigate the website - showing them where to find features and how to use them.

**EXACT NAVIGATION GUIDANCE:**

**Main Navigation:**
- Home: Click "Huntorix" logo
- Opportunities: Browse job listings
- Headhunters: Directory of professionals
- Messages: Communication center
- Dashboard: Personal dashboard
- Profile icon: Settings/Profile/Logout

**For Employers:**

1. **Post a Job:**
   - Dashboard → Click blue "Post New Job" button (top right)
   - Fill form → Click "Create Job"

2. **Manage Jobs:**
   - Sidebar → "My Jobs"
   - View/Edit/Delete jobs

3. **Find Headhunters:**
   - Top nav → "Headhunters"
   - Use filters and search
   - Click "Save" or "Invite to Job"

4. **Review Applications:**
   - Sidebar → "Applications"
   - Filter by status
   - Accept or reject

**For Headhunters:**

1. **Browse Jobs:**
   - Top nav → "Opportunities"
   - Use filters and search

2. **Apply to Jobs:**
   - Open job → Click "Apply Now"
   - Fill form → Submit

3. **Manage Profile:**
   - Profile icon → "Settings"
   - Update information

4. **Track Applications:**
   - Sidebar → "Applications"

**Common Features:**
- Settings: Profile icon → "Settings"
- Messages: Top nav → "Messages"
- Saved Items: Sidebar options

**REMEMBER:** You only explain WHERE features are and HOW to access them. You never share actual data, personal information, or private details.

Be helpful, concise, and precise with navigation instructions only.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
