import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  property_id?: string;
  idempotency_key?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let requestBody: RequestBody = {};
    try {
      requestBody = await req.json();
    } catch {
      // Allow empty body for backward compatibility
    }

    const { property_id, idempotency_key } = requestBody;

    console.log('Generate PO request:', { property_id, idempotency_key });

    // Check for existing PO with this idempotency key
    if (idempotency_key) {
      const { data: existingPO, error: checkError } = await supabase
        .from('purchase_orders')
        .select('po_number, id')
        .eq('idempotency_key', idempotency_key)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking idempotency:', checkError);
        throw checkError;
      }

      if (existingPO) {
        console.log('Returning existing PO:', existingPO.po_number);
        return new Response(
          JSON.stringify({ 
            po_number: existingPO.po_number,
            existing: true,
            po_id: existingPO.id,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get property code if property_id provided
    let propertyCode = 'GEN';
    if (property_id) {
      const { data: property, error: propError } = await supabase
        .from('properties')
        .select('code, name')
        .eq('id', property_id)
        .maybeSingle();

      if (propError) {
        console.error('Error fetching property:', propError);
      } else if (property) {
        // Use property code or derive from name
        propertyCode = property.code || 
          property.name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
      }
    }

    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;

    // Generate PO number: PO-{PROPERTY_CODE}-YYYYMM-XXXXX
    const poPrefix = `PO-${propertyCode}-${yearMonth}-`;

    // Get the latest PO number for this property and month
    const { data: latestPO, error: queryError } = await supabase
      .from('purchase_orders')
      .select('po_number')
      .like('po_number', `${poPrefix}%`)
      .order('po_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Error querying latest PO:', queryError);
      throw queryError;
    }

    // Extract sequence number and increment
    let sequence = 1;
    if (latestPO?.po_number) {
      const parts = latestPO.po_number.split('-');
      const lastSequence = parseInt(parts[3] || '0', 10);
      sequence = lastSequence + 1;
    }

    // Format: PO-{PROPERTY_CODE}-YYYYMM-XXXXX
    const poNumber = `${poPrefix}${String(sequence).padStart(5, '0')}`;

    console.log('Generated PO number:', poNumber);

    return new Response(
      JSON.stringify({ 
        po_number: poNumber,
        existing: false,
        property_code: propertyCode,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-po-number:', error);
    
    // Return structured error for frontend handling
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate PO number',
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details || error.hint || 'An unexpected error occurred',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
