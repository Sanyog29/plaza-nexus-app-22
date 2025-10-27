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

    // Check if the user is an admin or super_admin (using user_roles table)
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (roleError) {
      console.error('Error checking admin role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify admin permissions', details: roleError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!adminRole) {
      console.error('Permission denied for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Admin or Super Admin access required.' }),
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

    // Property scoping validation (only for regular admins, not super_admins)
    const isSuperAdmin = adminRole.role === 'super_admin';
    
    if (!isSuperAdmin) {
      // Regular admins can only delete users within their assigned properties
      // Get the target user's primary property
      const { data: targetProperty, error: targetPropError } = await supabaseAdmin
        .from('property_assignments')
        .select('property_id')
        .eq('user_id', user_id)
        .eq('is_primary', true)
        .maybeSingle();

      if (targetPropError) {
        console.error('Error fetching target user property:', targetPropError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify property access', details: targetPropError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!targetProperty) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete user: No property assignment found' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if the admin has access to the target property
      const { data: hasAccess, error: accessError } = await supabaseAdmin
        .rpc('user_has_property_access', { 
          check_user_id: user.id, 
          check_property_id: targetProperty.property_id 
        });

      if (accessError) {
        console.error('Error checking property access:', accessError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify property access', details: accessError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      if (!hasAccess) {
        console.error(`Admin ${user.id} attempted to delete user ${user_id} outside their property scope`);
        return new Response(
          JSON.stringify({ error: 'Admins can only delete users within their assigned properties' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // First, cascade delete all user data using our comprehensive function
    const { data: cascadeResult, error: cascadeError } = await supabaseAdmin.rpc(
      'admin_cascade_delete_user_data',
      { target_user_id: user_id }
    );

    if (cascadeError || !cascadeResult?.success) {
      console.error('Error in cascade deletion:', cascadeError || cascadeResult);
      
      // Log failed cascade deletion (without PII)
      await supabaseAdmin.from('audit_logs').insert({
        user_id: user.id,
        action: 'cascade_delete_failed',
        resource_type: 'user',
        resource_id: user_id,
        new_values: { 
          error: cascadeError?.message || cascadeResult?.error || 'Unknown cascade deletion error',
          target_user_id: user_id,
          attempted_by_user_id: user.id
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
      // Log the failed deletion attempt (without PII)
      await supabaseAdmin
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action: 'delete_user_failed',
          resource_type: 'user',
          resource_id: user_id,
          new_values: {
            error: deleteError.message,
            target_user_id: user_id,
            attempted_by_user_id: user.id,
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

    // Log successful deletion with cascade summary (NO PII - only user IDs)
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'delete_user',
        resource_type: 'user',
        resource_id: user_id,
        new_values: {
          deleted_user_id: user_id,
          deleted_by_admin_id: user.id,
          deleting_user_role: adminRole.role,
          property_scope_bypassed: isSuperAdmin,
          deletion_timestamp: new Date().toISOString(),
          cascade_summary: cascadeResult.cleanup_summary
        }
      });

    // Log to console with user IDs only (no emails for GDPR compliance)
    console.log(`User ${user_id} and all related data deleted by admin ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User and all related data deleted successfully',
        deleted_user_id: user_id,
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