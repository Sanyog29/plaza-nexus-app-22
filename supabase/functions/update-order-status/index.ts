import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateOrderStatusRequest {
  order_id: string;
  new_status: string;
  notes?: string;
}

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'declined'],
  accepted: ['preparing', 'declined'],
  preparing: ['ready', 'declined'],
  ready: ['completed', 'declined'],
  completed: [],
  declined: [],
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

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

    const { order_id, new_status, notes }: UpdateOrderStatusRequest = await req.json();

    if (!order_id || !new_status) {
      throw new Error("Missing required fields: order_id and new_status");
    }

    // Get the order with vendor information
    const { data: order, error: orderError } = await supabaseAdmin
      .from("cafeteria_orders")
      .select(`
        id,
        status,
        vendor_id,
        user_id,
        total_amount
      `)
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      throw new Error("Order not found");
    }

    // Verify user is staff for this vendor
    const { data: vendorStaff, error: staffError } = await supabaseAdmin
      .from("vendor_staff")
      .select("user_id, vendor_id")
      .eq("user_id", user.id)
      .eq("vendor_id", order.vendor_id)
      .eq("is_active", true)
      .maybeSingle();

    if (staffError) {
      console.error("Staff verification error:", staffError);
      throw new Error("Failed to verify vendor staff permissions");
    }

    if (!vendorStaff) {
      console.error(`Permission denied: User ${user.id} not staff for vendor ${order.vendor_id}`);
      throw new Error("Only vendor staff can update order status");
    }

    // Validate status transition
    const currentStatus = order.status;
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    
    if (!allowedTransitions.includes(new_status)) {
      throw new Error(
        `Invalid status transition from '${currentStatus}' to '${new_status}'. ` +
        `Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }

    // Update order status
    const updateData: any = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    // Set timestamps for specific statuses
    if (new_status === 'accepted') {
      updateData.accepted_at = new Date().toISOString();
    } else if (new_status === 'preparing') {
      updateData.preparing_at = new Date().toISOString();
    } else if (new_status === 'ready') {
      updateData.ready_at = new Date().toISOString();
    } else if (new_status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from("cafeteria_orders")
      .update(updateData)
      .eq("id", order_id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update order status");
    }

    // Log to audit trail
    await supabaseAdmin.from("audit_logs").insert({
      user_id: user.id,
      action: "update_order_status",
      resource_type: "cafeteria_order",
      resource_id: order_id,
      old_values: { status: currentStatus },
      new_values: { 
        status: new_status,
        notes: notes,
        vendor_id: order.vendor_id,
      },
    });

    console.log(`Order ${order_id} status updated: ${currentStatus} -> ${new_status} by user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Order status updated to ${new_status}`,
        order_id,
        old_status: currentStatus,
        new_status,
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
    console.error("Error in update-order-status function:", error);
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
