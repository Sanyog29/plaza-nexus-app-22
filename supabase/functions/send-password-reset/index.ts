import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.52.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email || !validateEmail(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid email format" 
        }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user exists using admin privileges
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      throw new Error("Failed to verify email");
    }

    const userExists = users.some(u => u.email?.toLowerCase() === email.toLowerCase());

    if (userExists) {
      // Generate password reset link
      const origin = req.headers.get("origin") || supabaseUrl;
      const { data, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: {
          redirectTo: `${origin}/auth?reset=true`,
        },
      });

      if (linkError) {
        console.error("Error generating reset link:", linkError);
        throw new Error("Failed to generate reset link");
      }

      // Send custom branded email via Resend
      const resetLink = data.properties.action_link;
      
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); width: 80px; height: 80px; border-radius: 20px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: bold;">
        AP
      </div>
      <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #ffffff;">AUTOPILOT</h1>
      <p style="margin: 8px 0 0; font-size: 14px; color: #9CA3AF;">Building Management System</p>
    </div>

    <!-- Main Content -->
    <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 32px; backdrop-filter: blur(10px);">
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #ffffff;">Reset Your Password</h2>
      
      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #D1D5DB;">
        We received a request to reset your password for your AUTOPILOT account. Click the button below to create a new password.
      </p>

      <!-- Reset Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Reset Password
        </a>
      </div>

      <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #9CA3AF;">
        Or copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color: #8B5CF6; word-break: break-all;">${resetLink}</a>
      </p>

      <!-- Security Notice -->
      <div style="margin-top: 32px; padding: 16px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #FCA5A5;">
          <strong>Important:</strong> This password reset link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px; padding-top: 32px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
      <p style="margin: 0 0 8px; font-size: 14px; color: #6B7280;">
        Need help? Contact our support team
      </p>
      <p style="margin: 0; font-size: 12px; color: #4B5563;">
        © ${new Date().getFullYear()} AUTOPILOT Building Management System. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
      `.trim();

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AUTOPILOT <onboarding@resend.dev>",
          to: [email],
          subject: "Reset Your AUTOPILOT Password",
          html: htmlContent,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error("Resend API error:", errorText);
        throw new Error("Failed to send reset email");
      }

      const emailResult = await emailResponse.json();
      console.log(`Password reset email sent successfully to: ${email}`, emailResult);
    } else {
      // Log attempt for security monitoring but don't reveal user doesn't exist
      console.log(`Password reset attempted for non-existent email: ${email}`);
    }

    // Always return success to prevent email enumeration
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "If your email is registered, you'll receive a password reset link shortly." 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Failed to process password reset request",
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);
