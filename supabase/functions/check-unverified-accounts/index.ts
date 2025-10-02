import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    console.log("Checking for unverified accounts...");

    // Get unverified headhunter profiles
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "headhunter")
      .eq("email_verified", false)
      .eq("account_status", "pending_verification");

    if (fetchError) {
      console.error("Error fetching profiles:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${profiles?.length || 0} unverified accounts`);

    let firstReminders = 0;
    let secondReminders = 0;
    let deactivations = 0;

    for (const profile of profiles || []) {
      const verificationSentAt = new Date(profile.verification_sent_at);
      
      // Deactivate accounts unverified for more than 7 days
      if (verificationSentAt < oneWeekAgo && !profile.second_reminder_sent_at) {
        console.log(`Sending final reminder and deactivating: ${profile.email}`);
        
        await resend.emails.send({
          from: "Headhunter Network <onboarding@resend.dev>",
          to: [profile.email],
          subject: "Final reminder: Verify your account",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc2626;">Final Reminder: Account Deactivation</h2>
              <p>Hi ${profile.name},</p>
              <p>Your headhunter account has been deactivated because you haven't verified your email address.</p>
              <p>If you'd still like to join our platform, please contact our support team.</p>
              <p>Best regards,<br>The Headhunter Network Team</p>
            </div>
          `,
        });

        await supabase
          .from("profiles")
          .update({
            account_status: "deactivated",
            second_reminder_sent_at: now.toISOString(),
          })
          .eq("id", profile.id);

        deactivations++;
      }
      // Send second reminder after 7 days
      else if (verificationSentAt < oneWeekAgo && profile.first_reminder_sent_at && !profile.second_reminder_sent_at) {
        console.log(`Sending second reminder to: ${profile.email}`);
        
        await resend.emails.send({
          from: "Headhunter Network <onboarding@resend.dev>",
          to: [profile.email],
          subject: "Last chance: Verify your account",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ea580c;">Last Chance to Verify</h2>
              <p>Hi ${profile.name},</p>
              <p>This is your final reminder to verify your email address. Your account will be deactivated soon if you don't verify.</p>
              <p>Please verify your email to access the platform and start connecting with employers.</p>
              <p>Best regards,<br>The Headhunter Network Team</p>
            </div>
          `,
        });

        await supabase
          .from("profiles")
          .update({ second_reminder_sent_at: now.toISOString() })
          .eq("id", profile.id);

        secondReminders++;
      }
      // Send first reminder after 24 hours
      else if (verificationSentAt < twentyFourHoursAgo && !profile.first_reminder_sent_at) {
        console.log(`Sending first reminder to: ${profile.email}`);
        
        await resend.emails.send({
          from: "Headhunter Network <onboarding@resend.dev>",
          to: [profile.email],
          subject: "Don't forget to verify your account",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #667eea;">Verify Your Account</h2>
              <p>Hi ${profile.name},</p>
              <p>We noticed you haven't verified your email address yet. Please verify to access all features of the Headhunter Network.</p>
              <p>Check your inbox for the verification email we sent when you registered.</p>
              <p>Best regards,<br>The Headhunter Network Team</p>
            </div>
          `,
        });

        await supabase
          .from("profiles")
          .update({ first_reminder_sent_at: now.toISOString() })
          .eq("id", profile.id);

        firstReminders++;
      }
    }

    console.log(`Sent ${firstReminders} first reminders, ${secondReminders} second reminders, ${deactivations} deactivations`);

    return new Response(
      JSON.stringify({
        success: true,
        firstReminders,
        secondReminders,
        deactivations,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-unverified-accounts function:", error);
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
