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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Generating PO number...');

    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;

    // Get the latest PO number for this month
    const { data: latestPO, error: queryError } = await supabase
      .from('purchase_orders')
      .select('po_number')
      .like('po_number', `PO-${yearMonth}-%`)
      .order('po_number', { ascending: false })
      .limit(1)
      .single();

    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Error querying latest PO:', queryError);
      throw queryError;
    }

    // Extract sequence number and increment
    let sequence = 1;
    if (latestPO?.po_number) {
      const parts = latestPO.po_number.split('-');
      const lastSequence = parseInt(parts[2] || '0', 10);
      sequence = lastSequence + 1;
    }

    // Format: PO-YYYYMM-XXXXX
    const poNumber = `PO-${yearMonth}-${String(sequence).padStart(5, '0')}`;

    console.log('Generated PO number:', poNumber);

    return new Response(
      JSON.stringify({ po_number: poNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-po-number:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
