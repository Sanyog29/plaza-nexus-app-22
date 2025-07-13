import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  content: string;
  template?: string;
  variables?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, content, template, variables }: EmailRequest = await req.json();

    // Get email configuration from environment variables
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Process template variables if provided
    let processedContent = content;
    if (variables) {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedContent = processedContent.replace(regex, value);
      });
    }

    // Send email using Resend
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Plaza Nexus <onboarding@resend.dev>",
        to: Array.isArray(to) ? to : [to],
        subject: subject,
        html: processedContent.replace(/\n/g, '<br>'),
        text: processedContent,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const emailResult = await response.json();
    console.log("Email sent successfully:", emailResult);

    // Log email activity (optional - could store in database)
    const logEntry = {
      timestamp: new Date().toISOString(),
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: subject,
      template: template || 'custom',
      status: 'sent',
      email_id: emailResult.id
    };

    return new Response(JSON.stringify({
      success: true,
      message: "Email sent successfully",
      email_id: emailResult.id,
      log: logEntry
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: "Check function logs for more information"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);