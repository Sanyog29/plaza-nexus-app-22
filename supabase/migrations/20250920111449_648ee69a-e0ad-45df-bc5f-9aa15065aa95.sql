-- First, create or replace the admin_cascade_delete_user_data function that accepts calling_user_id
CREATE OR REPLACE FUNCTION public.admin_cascade_delete_user_data(
  target_user_id uuid,
  calling_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_profile RECORD;
  cleanup_summary jsonb := '[]'::jsonb;
  deleted_count integer;
  table_name text;
BEGIN
  -- Check if calling user is admin
  SELECT * INTO caller_profile
  FROM public.profiles
  WHERE id = calling_user_id;
  
  IF NOT FOUND OR caller_profile.role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only administrators can delete user data');
  END IF;
  
  -- Prevent self-deletion
  IF target_user_id = calling_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot delete your own account');
  END IF;
  
  -- Delete from various tables (add more as needed)
  -- Audit logs
  DELETE FROM public.audit_logs WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('audit_logs', deleted_count);
  
  -- User invitations
  DELETE FROM public.user_invitations WHERE invited_by = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('user_invitations', deleted_count);
  
  -- Maintenance requests
  DELETE FROM public.maintenance_requests WHERE created_by = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('maintenance_requests', deleted_count);
  
  -- Orders
  DELETE FROM public.cafeteria_orders WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('cafeteria_orders', deleted_count);
  
  -- Vendor staff assignments
  DELETE FROM public.vendor_staff WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('vendor_staff', deleted_count);
  
  -- Notifications
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('notifications', deleted_count);
  
  -- Finally delete profile
  DELETE FROM public.profiles WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('profiles', deleted_count);
  
  RETURN jsonb_build_object(
    'success', true, 
    'cleanup_summary', cleanup_summary,
    'message', 'User data successfully cleaned up'
  );
END;
$$;