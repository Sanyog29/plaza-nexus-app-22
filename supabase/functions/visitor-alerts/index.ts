import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// This function runs periodically to check for overdue visitors and send alerts
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
    const today = now.toISOString().split('T')[0];

    console.log("Checking for overdue visitors on", today);

    // Find visitors who are overdue (more than 15 minutes past expected time)
    const { data: overdueVisitors, error } = await supabase
      .from('visitors')
      .select(`
        *,
        profiles!visitors_host_id_fkey (*)
      `)
      .eq('visit_date', today)
      .eq('status', 'scheduled')
      .eq('approval_status', 'approved')
      .not('entry_time', 'is', null);

    if (error) {
      console.error("Error fetching visitors:", error);
      throw error;
    }

    console.log(`Found ${overdueVisitors?.length || 0} visitors to check`);

    let alertsSent = 0;

    if (overdueVisitors) {
      for (const visitor of overdueVisitors) {
        const expectedTime = new Date(`${visitor.visit_date}T${visitor.entry_time}`);
        const overdueDuration = now.getTime() - expectedTime.getTime();
        const overdueMinutes = Math.floor(overdueDuration / (1000 * 60));

        if (overdueMinutes > 15) {
          // Check if we've already sent an alert for this visitor today
          const { data: existingAlert } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', visitor.host_id)
            .eq('title', 'Visitor Overdue')
            .gte('created_at', today)
            .contains('message', visitor.name)
            .limit(1);

          if (!existingAlert || existingAlert.length === 0) {
            // Create notification
            const { error: notifError } = await supabase.rpc('create_notification', {
              target_user_id: visitor.host_id,
              notification_title: 'Visitor Overdue',
              notification_message: `${visitor.name} was expected at ${visitor.entry_time} but hasn't checked in yet (${overdueMinutes} minutes overdue).`,
              notification_type: 'warning',
              action_url: '/security'
            });

            if (notifError) {
              console.error("Error creating notification:", notifError);
            } else {
              alertsSent++;
              console.log(`Alert sent for overdue visitor: ${visitor.name} (${overdueMinutes} min overdue)`);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${overdueVisitors?.length || 0} visitors, sent ${alertsSent} alerts` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in visitor-alerts function:", error);
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