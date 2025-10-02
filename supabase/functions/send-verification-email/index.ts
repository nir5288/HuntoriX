import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  userId: string;
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { userId, email, name }: VerificationEmailRequest = await req.json();

    console.log("Sending verification email to:", email);

    // Generate verification token
    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (tokenError) {
      console.error("Error generating verification link:", tokenError);
      throw tokenError;
    }

    const verificationLink = tokenData.properties?.action_link;

    // Send verification email
    const emailResponse = await resend.emails.send({
      from: "Headhunter Network <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your headhunter account",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Account</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Headhunter Network!</h1>
            </div>
            
            <div style="background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${name},</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                Thank you for registering as a headhunter! To complete your registration and start connecting with top employers, please verify your email address.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${verificationLink}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 16px 40px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 600;
                          font-size: 16px;
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  Verify Email Address
                </a>
              </div>
              
              <p style="font-size: 14px; color: #666; margin-top: 30px;">
                This link will expire in 24 hours. If you didn't create this account, you can safely ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #999; text-align: center;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <span style="color: #667eea; word-break: break-all;">${verificationLink}</span>
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Verification email sent successfully:", emailResponse);

    // Update profile with verification sent timestamp
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ verification_sent_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
    }

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
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
