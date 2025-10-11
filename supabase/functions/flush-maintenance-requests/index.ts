import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FlushRequest {
  dateFrom: string;
  dateTo: string;
  statuses: string[];
  exportBeforeDelete?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin or staff
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'ops_supervisor', 'field_staff'].includes(profile.role)) {
      throw new Error('Insufficient permissions');
    }

    const { dateFrom, dateTo, statuses, exportBeforeDelete }: FlushRequest = await req.json();

    console.log('Flush request:', { dateFrom, dateTo, statuses, userId: user.id });

    // Fetch requests to be deleted
    const { data: requests, error: fetchError } = await supabaseClient
      .from('maintenance_requests')
      .select('id')
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo)
      .in('status', statuses)
      .is('deleted_at', null);

    if (fetchError) {
      console.error('Error fetching requests:', fetchError);
      throw fetchError;
    }

    const requestIds = requests?.map(r => r.id) || [];
    console.log(`Found ${requestIds.length} requests to delete`);

    if (requestIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          deletedCount: 0,
          message: 'No requests found matching criteria'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Export data if requested
    let exportData = null;
    if (exportBeforeDelete) {
      const { data: exportRequests, error: exportError } = await supabaseClient
        .from('maintenance_requests')
        .select('*')
        .in('id', requestIds);

      if (!exportError) {
        exportData = exportRequests;
        console.log(`Exported ${exportRequests?.length || 0} requests`);
      }
    }

    // Perform soft delete using the database function
    const { data: deleteResult, error: deleteError } = await supabaseClient.rpc(
      'soft_delete_maintenance_requests',
      {
        request_ids: requestIds,
        deleted_by_user: user.id
      }
    );

    if (deleteError) {
      console.error('Error deleting requests:', deleteError);
      throw deleteError;
    }

    console.log('Delete result:', deleteResult);

    // Log the bulk operation
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'bulk_flush_requests',
        resource_type: 'maintenance_requests',
        new_values: {
          deleted_count: requestIds.length,
          date_range: { from: dateFrom, to: dateTo },
          statuses,
          exported: !!exportBeforeDelete
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount: requestIds.length,
        exportData: exportData || undefined,
        message: `Successfully deleted ${requestIds.length} requests`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Error in flush-maintenance-requests function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' ? 401 : 
                error.message === 'Insufficient permissions' ? 403 : 500
      }
    );
  }
});
