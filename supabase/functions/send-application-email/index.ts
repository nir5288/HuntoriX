import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
// Temporarily disabled - needs resend package configuration
// import { Resend } from "npm:resend@2.0.0";

// const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApplicationEmailRequest {
  jobId: string;
  applicationId: string;
  headhunterId: string;
  jobTitle: string;
  etaDays: number;
  feeModel: string;
  feeValue: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { jobId, applicationId, headhunterId, jobTitle, etaDays, feeModel, feeValue }: ApplicationEmailRequest = await req.json();

    console.log("Processing application email:", { jobId, applicationId, headhunterId });

    // Get job details and employer email
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .select('created_by')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error("Error fetching job:", jobError);
      throw new Error("Job not found");
    }

    // Get employer profile
    const { data: employer, error: employerError } = await supabaseClient
      .from('profiles')
      .select('email, name')
      .eq('id', job.created_by)
      .single();

    if (employerError || !employer) {
      console.error("Error fetching employer:", employerError);
      throw new Error("Employer not found");
    }

    // Get headhunter profile
    const { data: headhunter, error: headhunterError } = await supabaseClient
      .from('profiles')
      .select('name')
      .eq('id', headhunterId)
      .single();

    if (headhunterError || !headhunter) {
      console.error("Error fetching headhunter:", headhunterError);
      throw new Error("Headhunter not found");
    }

    const appLink = `${Deno.env.get('SUPABASE_URL')?.replace('//', '//app.')}/jobs/${jobId}?tab=applicants`;

    // Email functionality temporarily disabled - needs resend package configuration
    console.log("Would send email to:", employer.email);
    console.log("Email subject:", `New application for ${jobTitle}`);
    
    /* 
    const emailResponse = await resend.emails.send({
      from: "HireHub <onboarding@resend.dev>",
      to: [employer.email],
      subject: `New application for ${jobTitle}`,
      html: `
        <h2>New Application Received</h2>
        <p><strong>${headhunter.name || 'A headhunter'}</strong> has applied to your job posting: <strong>${jobTitle}</strong></p>
        
        <h3>Application Details:</h3>
        <ul>
          <li><strong>Estimated Time to Fill:</strong> ${etaDays} days</li>
          <li><strong>Fee Model:</strong> ${feeModel === 'percent_fee' ? 'Percentage Fee' : feeModel === 'flat' ? 'Flat Fee' : 'Hourly Rate'}</li>
          <li><strong>Proposed Fee:</strong> ${feeValue}${feeModel === 'percent_fee' ? '%' : ''}</li>
        </ul>
        
        <p><a href="${appLink}" style="background: linear-gradient(135deg, #FF6B9D 0%, #C084FC 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">Review Application</a></p>
        
        <p style="color: #666; font-size: 14px; margin-top: 24px;">You can accept, decline, or chat with the applicant directly from your dashboard.</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);
    */

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-application-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
