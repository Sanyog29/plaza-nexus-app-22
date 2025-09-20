import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role
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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if the user is an admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin access required.' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { user_id }: DeleteUserRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Prevent admin from deleting themselves
    if (user_id === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get user details before deletion for logging
    const { data: userToDelete, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    
    if (fetchError || !userToDelete) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // First, cascade delete all user data using our comprehensive function
    const { data: cascadeResult, error: cascadeError } = await supabaseAdmin.rpc(
      'admin_cascade_delete_user_data',
      { target_user_id: user_id, calling_user_id: user.id }
    );

    if (cascadeError || !cascadeResult?.success) {
      console.error('Error in cascade deletion:', cascadeError || cascadeResult);
      
      // Log failed cascade deletion
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'cascade_delete_failed',
        resource_type: 'user',
        resource_id: user_id,
        new_values: { 
          error: cascadeError?.message || cascadeResult?.error || 'Unknown cascade deletion error',
          target_email: userToDelete.user.email,
          attempted_by: user.email
        }
      });

      return new Response(
        JSON.stringify({ 
          error: 'Failed to clean up user data', 
          details: cascadeError?.message || cascadeResult?.error 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Now delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      // Log the failed deletion attempt
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'delete_user_failed',
          resource_type: 'user',
          resource_id: user_id,
          new_values: {
            error: deleteError.message,
            target_email: userToDelete.user.email,
            attempted_by: user.email,
            cascade_summary: cascadeResult.cleanup_summary
          }
        });
      
      return new Response(
        JSON.stringify({ error: 'Failed to delete user', details: deleteError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Log successful deletion with cascade summary
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'delete_user',
        resource_type: 'user',
        resource_id: user_id,
        new_values: {
          deleted_user_email: userToDelete.user.email,
          deleted_by: user.email,
          deletion_timestamp: new Date().toISOString(),
          cascade_summary: cascadeResult.cleanup_summary
        }
      });

    console.log(`User ${userToDelete.user.email} and all related data deleted by admin ${user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User and all related data deleted successfully',
        deleted_user: {
          id: user_id,
          email: userToDelete.user.email
        },
        cleanup_summary: cascadeResult.cleanup_summary
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in admin-delete-user function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);