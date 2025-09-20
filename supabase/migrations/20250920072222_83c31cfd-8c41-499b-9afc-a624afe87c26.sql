-- Create comprehensive cascade deletion function for user data
CREATE OR REPLACE FUNCTION public.admin_cascade_delete_user_data(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  cleanup_summary jsonb := '{}';
  deleted_count integer;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only administrators can delete user data');
  END IF;
  
  -- Start transaction for atomic cleanup
  BEGIN
    -- Clean up vendor_staff assignments
    DELETE FROM vendor_staff WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('vendor_staff_deleted', deleted_count);
    
    -- Clean up cafeteria orders
    DELETE FROM cafeteria_orders WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('cafeteria_orders_deleted', deleted_count);
    
    -- Clean up notifications
    DELETE FROM notifications WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('notifications_deleted', deleted_count);
    
    -- Clean up delivery notifications
    DELETE FROM delivery_notifications WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('delivery_notifications_deleted', deleted_count);
    
    -- Clean up room bookings
    DELETE FROM room_bookings WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('room_bookings_deleted', deleted_count);
    
    -- Clean up booking templates
    DELETE FROM booking_templates WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('booking_templates_deleted', deleted_count);
    
    -- Clean up maintenance requests (assigned_to)
    UPDATE maintenance_requests SET assigned_to = NULL WHERE assigned_to = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('maintenance_assignments_cleared', deleted_count);
    
    -- Clean up daily checklists
    DELETE FROM daily_checklists WHERE staff_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('daily_checklists_deleted', deleted_count);
    
    -- Clean up staff attendance
    DELETE FROM staff_attendance WHERE staff_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('staff_attendance_deleted', deleted_count);
    
    -- Clean up enhanced staff availability
    DELETE FROM enhanced_staff_availability WHERE staff_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('staff_availability_deleted', deleted_count);
    
    -- Clean up dietary preferences
    DELETE FROM dietary_preferences WHERE user_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('dietary_preferences_deleted', deleted_count);
    
    -- Clean up communication threads and messages
    DELETE FROM communication_messages WHERE sender_id = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('communication_messages_deleted', deleted_count);
    
    DELETE FROM communication_threads WHERE created_by = target_user_id;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    cleanup_summary := cleanup_summary || jsonb_build_object('communication_threads_deleted', deleted_count);
    
    -- Log the cascade deletion
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
    VALUES (
      auth.uid(),
      'cascade_delete_user_data',
      'user_cleanup',
      target_user_id,
      cleanup_summary
    );
    
    RETURN jsonb_build_object('success', true, 'cleanup_summary', cleanup_summary);
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback and return error
    RAISE;
    RETURN jsonb_build_object('error', 'Cleanup failed: ' || SQLERRM);
  END;
END;
$function$;

-- Create function to get users not assigned to any vendor
CREATE OR REPLACE FUNCTION public.admin_get_unassigned_users()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  role text,
  department text,
  is_assigned_to_vendor boolean,
  assigned_vendor_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view user assignment data';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.role::text,
    p.department,
    CASE WHEN vs.user_id IS NOT NULL THEN true ELSE false END as is_assigned_to_vendor,
    v.name as assigned_vendor_name
  FROM profiles p
  LEFT JOIN vendor_staff vs ON p.id = vs.user_id AND vs.is_active = true
  LEFT JOIN vendors v ON vs.vendor_id = v.id
  WHERE p.approval_status = 'approved'
  ORDER BY 
    CASE WHEN vs.user_id IS NULL THEN 0 ELSE 1 END, -- Unassigned users first
    p.first_name, p.last_name;
END;
$function$;

-- Create function to clean up orphaned vendor staff records
CREATE OR REPLACE FUNCTION public.admin_cleanup_orphaned_vendor_staff()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  orphaned_count integer;
  cleanup_result jsonb;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only administrators can clean up orphaned records');
  END IF;
  
  -- Count orphaned records first
  SELECT COUNT(*) INTO orphaned_count
  FROM vendor_staff vs
  LEFT JOIN profiles p ON vs.user_id = p.id
  WHERE p.id IS NULL;
  
  -- Delete orphaned vendor staff records
  DELETE FROM vendor_staff 
  WHERE user_id IN (
    SELECT vs.user_id 
    FROM vendor_staff vs
    LEFT JOIN profiles p ON vs.user_id = p.id
    WHERE p.id IS NULL
  );
  
  GET DIAGNOSTICS orphaned_count = ROW_COUNT;
  
  -- Log the cleanup action
  INSERT INTO audit_logs (user_id, action, resource_type, new_values)
  VALUES (
    auth.uid(),
    'cleanup_orphaned_vendor_staff',
    'data_cleanup',
    jsonb_build_object('orphaned_records_deleted', orphaned_count)
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'orphaned_records_deleted', orphaned_count,
    'message', format('Successfully cleaned up %s orphaned vendor staff records', orphaned_count)
  );
END;
$function$;

-- Update admin_get_vendor_staff_assignments to handle orphaned records gracefully
CREATE OR REPLACE FUNCTION public.admin_get_vendor_staff_assignments()
RETURNS TABLE(
  assignment_id uuid,
  user_id uuid,
  vendor_id uuid,
  vendor_name text,
  user_first_name text,
  user_last_name text,
  user_email text,
  is_active boolean,
  assigned_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view vendor staff assignments';
  END IF;
  
  RETURN QUERY
  SELECT 
    vs.id as assignment_id,
    vs.user_id,
    vs.vendor_id,
    v.name as vendor_name,
    COALESCE(p.first_name, '[ORPHANED]') as user_first_name,
    COALESCE(p.last_name, '[RECORD]') as user_last_name,
    COALESCE(p.email, 'no-email@orphaned.record') as user_email,
    vs.is_active,
    vs.created_at as assigned_at
  FROM vendor_staff vs
  JOIN vendors v ON vs.vendor_id = v.id
  LEFT JOIN profiles p ON vs.user_id = p.id  -- LEFT JOIN to show orphaned records
  ORDER BY 
    CASE WHEN p.id IS NULL THEN 1 ELSE 0 END, -- Show orphaned records at top
    v.name, 
    COALESCE(p.first_name, ''), 
    COALESCE(p.last_name, '');
END;
$function$;