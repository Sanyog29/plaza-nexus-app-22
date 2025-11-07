import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { requisition_id } = await req.json();

    if (!requisition_id) {
      return new Response(
        JSON.stringify({ error: 'requisition_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing requisition acceptance:', requisition_id);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user has procurement role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['procurement_manager', 'purchase_executive'])
      .single();

    if (roleError || !userRole) {
      return new Response(
        JSON.stringify({ error: 'Only procurement staff can accept requisitions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency check: Check if PO already exists for this requisition
    const { data: existingPO, error: existingPOError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status, total_amount')
      .eq('requisition_list_id', requisition_id)
      .maybeSingle();

    if (existingPOError) {
      console.error('Error checking for existing PO:', existingPOError);
      throw new Error(`Failed to check existing PO: ${existingPOError.message}`);
    }

    if (existingPO) {
      console.log('PO already exists for requisition:', existingPO.po_number);
      return new Response(
        JSON.stringify({
          success: true,
          purchase_order: existingPO,
          message: 'Purchase order already exists for this requisition'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get requisition details
    const { data: requisition, error: reqError } = await supabase
      .from('requisition_lists')
      .select('*, property_id')
      .eq('id', requisition_id)
      .single();

    if (reqError || !requisition) {
      return new Response(
        JSON.stringify({ error: 'Requisition not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (requisition.status !== 'manager_approved') {
      return new Response(
        JSON.stringify({ error: 'Requisition must be manager approved' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate PO number using Supabase function invoke
    const { data: poData, error: poError } = await supabase.functions.invoke('generate-po-number');

    if (poError || !poData?.po_number) {
      throw new Error(`Failed to generate PO number: ${poError?.message || 'No PO number returned'}`);
    }

    const po_number = poData.po_number;
    console.log('Generated PO number:', po_number);

    // Get requisition items
    const { data: items, error: itemsError } = await supabase
      .from('requisition_list_items')
      .select('*')
      .eq('requisition_list_id', requisition_id);

    if (itemsError) {
      throw new Error(`Failed to fetch requisition items: ${itemsError.message}`);
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      const itemTotal = (item.estimated_unit_price || 0) * (item.quantity || 0);
      return sum + itemTotal;
    }, 0);

    let purchaseOrder;
    let poItems;

    try {
      // Create purchase order
      const { data: poData, error: poCreateError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number,
          requisition_list_id: requisition_id,
          property_id: requisition.property_id,
          status: 'accepted',
          total_amount: totalAmount,
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
          expected_delivery_date: requisition.expected_delivery_date,
          notes: `Generated from requisition ${requisition.order_number}`,
        })
        .select()
        .single();

      if (poCreateError) {
        console.error('Error creating PO:', poCreateError);
        throw new Error(`Failed to create purchase order: ${poCreateError.message}`);
      }

      purchaseOrder = poData;
      console.log('Created purchase order:', purchaseOrder.id);

      // Create PO items
      poItems = items.map(item => ({
        po_id: purchaseOrder.id,
        requisition_list_item_id: item.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit,
        estimated_unit_price: item.estimated_unit_price || 0,
        estimated_total_price: (item.estimated_unit_price || 0) * item.quantity,
        notes: item.description,
      }));

      const { error: itemsCreateError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsCreateError) {
        console.error('Error creating PO items:', itemsCreateError);
        throw new Error(`Failed to create PO items: ${itemsCreateError.message}`);
      }

      console.log('Created PO items:', poItems.length);

      // Update requisition status using authenticated client (for trigger)
      // This will populate changed_by via the database trigger
      const { error: updateError } = await supabaseClient
        .from('requisition_lists')
        .update({ status: 'po_created', updated_at: new Date().toISOString() })
        .eq('id', requisition_id);

      if (updateError) {
        console.error('Error updating requisition status:', updateError);
        throw new Error(`Failed to update requisition: ${updateError.message}`);
      }

      console.log('Requisition status updated. Status history will be created by trigger.');

    } catch (error) {
      // Rollback: Clean up PO and items if any step fails
      if (purchaseOrder?.id) {
        console.log('Attempting rollback: deleting PO items and PO');
        
        // Delete PO items first
        await supabase
          .from('purchase_order_items')
          .delete()
          .eq('po_id', purchaseOrder.id);
        
        // Delete PO
        await supabase
          .from('purchase_orders')
          .delete()
          .eq('id', purchaseOrder.id);
        
        console.log('Rollback completed');
      }
      
      throw error;
    }

    console.log('Requisition acceptance complete');

    return new Response(
      JSON.stringify({
        success: true,
        purchase_order: {
          id: purchaseOrder.id,
          po_number: purchaseOrder.po_number,
          status: purchaseOrder.status,
          total_amount: purchaseOrder.total_amount,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in accept-requisition:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
