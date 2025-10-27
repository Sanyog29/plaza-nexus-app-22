import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  user_id: string;
  action: 'approve' | 'reject';
  reason?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create regular client for user verification
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { persistSession: false },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the requesting user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("Authentication failed");
    }

    // Check if user is admin or super_admin (using user_roles table)
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"])
      .maybeSingle();

    if (roleError) {
      console.error("Error checking admin role:", roleError);
      throw new Error("Failed to verify admin permissions");
    }

    if (!adminRole) {
      console.error("Permission denied for user:", user.id);
      throw new Error("Only administrators and super administrators can approve/reject users");
    }

    const { user_id, action, reason }: ApprovalRequest = await req.json();

    if (!user_id || !action) {
      throw new Error("Missing required fields: user_id and action");
    }

    // Use the database functions that handle property scoping and permission checks
    let result;
    if (action === 'approve') {
      const { data, error } = await supabaseAdmin
        .rpc('approve_user', {
          target_user_id: user_id,
          approver_id: user.id
        });
      
      if (error) {
        console.error('Error approving user:', error);
        throw new Error(error.message || 'Failed to approve user');
      }
      
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .rpc('reject_user', {
          target_user_id: user_id,
          approver_id: user.id,
          reason: reason || ''
        });
      
      if (error) {
        console.error('Error rejecting user:', error);
        throw new Error(error.message || 'Failed to reject user');
      }
      
      result = data;
    }

    // Check if the function returned an error
    if (result && !result.success) {
      throw new Error(result.error || 'Operation failed');
    }

    console.log(`User ${user_id} ${action}d by admin ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${action}d successfully`,
        user_id,
        action,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in admin-approve-user function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});