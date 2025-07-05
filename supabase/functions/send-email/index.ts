import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type: 'booking_confirmation' | 'visitor_approval' | 'maintenance_sla' | 'general';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, type }: EmailRequest = await req.json();

    const fromEmail = getFromEmail(type);
    
    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getFromEmail(type: string): string {
  switch (type) {
    case 'booking_confirmation':
      return "Bookings <bookings@resend.dev>";
    case 'visitor_approval':
      return "Security <security@resend.dev>";
    case 'maintenance_sla':
      return "Maintenance <maintenance@resend.dev>";
    default:
      return "Plaza App <noreply@resend.dev>";
  }
}

serve(handler);