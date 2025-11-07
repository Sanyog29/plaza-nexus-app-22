import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorResponse {
  error: string;
  code?: string;
  details?: string;
  retryable?: boolean;
}

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
      const errorResponse: ErrorResponse = {
        error: 'requisition_id is required',
        code: 'MISSING_PARAMETER',
        retryable: false
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing requisition acceptance:', requisition_id);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      const errorResponse: ErrorResponse = {
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
        retryable: false
      };
      return new Response(
        JSON.stringify(errorResponse),
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
      const errorResponse: ErrorResponse = {
        error: 'Only procurement staff can accept requisitions',
        code: 'INSUFFICIENT_PRIVILEGES',
        details: 'Your role does not allow this operation',
        retryable: false
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency check: Check if PO already exists for this requisition
    const { data: existingPO, error: existingPOError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status, total_amount, version')
      .eq('requisition_list_id', requisition_id)
      .maybeSingle();

    if (existingPOError) {
      console.error('Error checking for existing PO:', existingPOError);
      const errorResponse: ErrorResponse = {
        error: 'Failed to check existing purchase order',
        code: 'DATABASE_ERROR',
        details: existingPOError.message,
        retryable: true
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      const errorResponse: ErrorResponse = {
        error: 'Requisition not found',
        code: 'NOT_FOUND',
        retryable: false
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (requisition.status !== 'manager_approved') {
      const errorResponse: ErrorResponse = {
        error: 'Requisition must be manager approved before creating purchase order',
        code: 'INVALID_STATUS',
        details: `Current status: ${requisition.status}`,
        retryable: false
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate PO number using enhanced function
    const { data: poNumberData, error: poNumberError } = await supabase
      .rpc('generate_po_number_enhanced', { p_property_id: requisition.property_id });

    if (poNumberError || !poNumberData) {
      console.error('Error generating PO number:', poNumberError);
      const errorResponse: ErrorResponse = {
        error: 'Failed to generate purchase order number',
        code: 'PO_NUMBER_GENERATION_FAILED',
        details: poNumberError?.message,
        retryable: true
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const po_number = poNumberData;
    console.log('Generated PO number:', po_number);

    // Get requisition items
    const { data: items, error: itemsError } = await supabase
      .from('requisition_list_items')
      .select('*')
      .eq('requisition_list_id', requisition_id);

    if (itemsError) {
      const errorResponse: ErrorResponse = {
        error: 'Failed to fetch requisition items',
        code: 'DATABASE_ERROR',
        details: itemsError.message,
        retryable: true
      };
      return new Response(
        JSON.stringify(errorResponse),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      const itemTotal = (item.estimated_unit_price || 0) * (item.quantity || 0);
      return sum + itemTotal;
    }, 0);

    // Generate idempotency key
    const idempotencyKey = `req-${requisition_id}-${Date.now()}`;

    let purchaseOrder;
    let poItems;

    try {
      // Create purchase order with idempotency key
      const { data: poData, error: poCreateError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number,
          requisition_list_id: requisition_id,
          property_id: requisition.property_id,
          status: 'accepted',
          total_amount: totalAmount > 0 ? totalAmount : 0.01, // Ensure positive amount
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
          expected_delivery_date: requisition.expected_delivery_date,
          notes: `Generated from requisition ${requisition.order_number}`,
          idempotency_key: idempotencyKey,
        })
        .select()
        .single();

      if (poCreateError) {
        console.error('Error creating PO:', poCreateError);
        
        // Check for specific constraint violations
        if (poCreateError.message?.includes('purchase_orders_property_requisition_unique')) {
          const errorResponse: ErrorResponse = {
            error: 'Purchase order already exists for this requisition',
            code: 'DUPLICATE_PO',
            retryable: false
          };
          return new Response(
            JSON.stringify(errorResponse),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        throw poCreateError;
      }

      purchaseOrder = poData;
      console.log('Created purchase order:', purchaseOrder.id);

      // Create PO items
      poItems = items.map(item => ({
        po_id: purchaseOrder.id,
        requisition_list_item_id: item.id,
        item_name: item.item_name,
        quantity: item.quantity || 1,
        unit: item.unit,
        estimated_unit_price: item.estimated_unit_price || 0,
        estimated_total_price: (item.estimated_unit_price || 0) * (item.quantity || 1),
        notes: item.description,
      }));

      const { error: itemsCreateError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);

      if (itemsCreateError) {
        console.error('Error creating PO items:', itemsCreateError);
        throw itemsCreateError;
      }

      console.log('Created PO items:', poItems.length);

      // Update requisition status using authenticated client (for trigger)
      const { error: updateError } = await supabaseClient
        .from('requisition_lists')
        .update({ status: 'po_created', updated_at: new Date().toISOString() })
        .eq('id', requisition_id);

      if (updateError) {
        console.error('Error updating requisition status:', updateError);
        throw updateError;
      }

      console.log('Requisition status updated to po_created');

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
          version: purchaseOrder.version,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in accept-requisition:', error);
    
    // Parse error and return structured response
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const errorResponse: ErrorResponse = {
      error: errorMessage,
      code: 'INTERNAL_ERROR',
      retryable: true
    };
    
    // Check for specific database errors
    if (errorMessage.includes('constraint')) {
      errorResponse.code = 'CONSTRAINT_VIOLATION';
      errorResponse.retryable = false;
    } else if (errorMessage.includes('timeout')) {
      errorResponse.code = 'TIMEOUT';
      errorResponse.retryable = true;
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
