import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting database cleanup job...');
    
    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const results = {
      timestamp: new Date().toISOString(),
      auditLogsDeleted: 0,
      requisitionItemsDeleted: 0,
      errors: [] as string[],
    };

    // 1. Purge audit logs older than 90 days
    console.log('Purging audit logs older than 90 days...');
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: auditLogsData, error: auditLogsError } = await supabaseAdmin
        .from('audit_logs')
        .delete()
        .lt('created_at', ninetyDaysAgo.toISOString())
        .select('id');

      if (auditLogsError) {
        throw new Error(`Audit logs cleanup failed: ${auditLogsError.message}`);
      }

      results.auditLogsDeleted = auditLogsData?.length || 0;
      console.log(`✓ Deleted ${results.auditLogsDeleted} audit log entries`);
    } catch (error: any) {
      console.error('Error purging audit logs:', error);
      results.errors.push(`Audit logs: ${error.message}`);
    }

    // 2. Hard delete soft-deleted requisition list items
    console.log('Hard deleting soft-deleted requisition items...');
    try {
      // Check if is_deleted column exists in requisition_list_items
      const { data: softDeletedItems, error: softDeletedError } = await supabaseAdmin
        .from('requisition_list_items')
        .select('id')
        .eq('is_deleted', true);

      if (softDeletedError) {
        // If column doesn't exist, skip this step
        if (softDeletedError.message.includes('column') && softDeletedError.message.includes('does not exist')) {
          console.log('⚠ is_deleted column not found in requisition_list_items table, skipping...');
        } else {
          throw new Error(`Soft-deleted items query failed: ${softDeletedError.message}`);
        }
      } else if (softDeletedItems && softDeletedItems.length > 0) {
        // Perform hard deletion
        const itemIds = softDeletedItems.map(item => item.id);
        
        const { error: deleteError } = await supabaseAdmin
          .from('requisition_list_items')
          .delete()
          .in('id', itemIds);

        if (deleteError) {
          throw new Error(`Hard deletion failed: ${deleteError.message}`);
        }

        results.requisitionItemsDeleted = softDeletedItems.length;
        console.log(`✓ Hard deleted ${results.requisitionItemsDeleted} requisition items`);
      } else {
        console.log('✓ No soft-deleted requisition items to clean up');
      }
    } catch (error: any) {
      console.error('Error hard deleting requisition items:', error);
      results.errors.push(`Requisition items: ${error.message}`);
    }

    // 3. Optional: Cleanup other soft-deleted records (maintenance_requests)
    console.log('Checking for other soft-deleted records...');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: deletedRequests, error: requestsError } = await supabaseAdmin
        .from('maintenance_requests')
        .select('id')
        .not('deleted_at', 'is', null)
        .lt('deleted_at', thirtyDaysAgo.toISOString());

      if (requestsError) {
        console.log('⚠ Could not query soft-deleted maintenance requests:', requestsError.message);
      } else if (deletedRequests && deletedRequests.length > 0) {
        // Delete old soft-deleted maintenance requests
        const requestIds = deletedRequests.map(r => r.id);
        
        const { error: deleteRequestsError } = await supabaseAdmin
          .from('maintenance_requests')
          .delete()
          .in('id', requestIds);

        if (deleteRequestsError) {
          console.error('Error deleting maintenance requests:', deleteRequestsError.message);
        } else {
          console.log(`✓ Hard deleted ${deletedRequests.length} old maintenance requests`);
        }
      }
    } catch (error: any) {
      console.error('Error cleaning maintenance requests:', error);
      results.errors.push(`Maintenance requests: ${error.message}`);
    }

    // Log cleanup summary
    console.log('Database cleanup completed:', results);

    return new Response(
      JSON.stringify({
        success: results.errors.length === 0,
        message: 'Database cleanup completed',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Critical error in database cleanup:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
