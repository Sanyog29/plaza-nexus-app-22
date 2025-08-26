-- Migration Part 3: Update remaining functions and policies

-- Update existing functions to work with new roles
CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('admin', 'mst', 'fe', 'hk', 'se', 'assistant_manager', 'assistant_floor_manager', 'assistant_general_manager', 'assistant_vice_president')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ops_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('mst', 'fe', 'hk', 'se', 'assistant_manager', 'assistant_floor_manager', 'admin')
  );
$$;

-- Update get_user_permissions function for new roles
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    permissions JSONB;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = user_id;
    
    permissions := CASE user_role
        WHEN 'admin' THEN jsonb_build_object(
            'can_manage_users', true,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', true,
            'can_view_analytics', true,
            'can_manage_vendors', true,
            'can_manage_system_settings', true,
            'can_approve_requests', true,
            'can_delete_users', true
        )
        -- L2 Management roles
        WHEN 'assistant_manager' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false,
            'can_approve_requests', true,
            'can_manage_staff_zones', true
        )
        WHEN 'assistant_floor_manager' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false,
            'can_approve_requests', true,
            'can_manage_staff_zones', true
        )
        -- L3 Senior Management roles
        WHEN 'assistant_general_manager' THEN jsonb_build_object(
            'can_manage_users', true,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', true,
            'can_view_analytics', true,
            'can_manage_vendors', true,
            'can_approve_requests', true,
            'can_manage_staff_zones', true
        )
        WHEN 'assistant_vice_president' THEN jsonb_build_object(
            'can_manage_users', true,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', true,
            'can_view_analytics', true,
            'can_manage_vendors', true,
            'can_approve_requests', true,
            'can_manage_staff_zones', true
        )
        -- L4 Executive roles (high-level read/approval)
        WHEN 'vp' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false,
            'can_approve_requests', true
        )
        WHEN 'ceo' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false,
            'can_approve_requests', true
        )
        WHEN 'cxo' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false,
            'can_approve_requests', true
        )
        -- L1 Operational staff
        WHEN 'mst' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_work_on_requests', true,
            'can_acknowledge_tickets', true,
            'can_upload_attachments', true
        )
        WHEN 'fe' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_work_on_requests', true,
            'can_acknowledge_tickets', true,
            'can_upload_attachments', true
        )
        WHEN 'hk' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_work_on_requests', true,
            'can_acknowledge_tickets', true,
            'can_upload_attachments', true
        )
        WHEN 'se' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_work_on_requests', true,
            'can_acknowledge_tickets', true,
            'can_upload_attachments', true,
            'can_manage_security', true
        )
        -- Tenant role (formerly tenant_manager)
        WHEN 'tenant' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_raise_requests', true,
            'can_view_own_requests', true
        )
        -- Vendor role (unchanged)
        WHEN 'vendor' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_view_vendor_orders', true,
            'can_manage_vendor_menu', true
        )
        ELSE jsonb_build_object()
    END;
    
    RETURN permissions;
END;
$$;

-- Update update_user_role_safe function to include new roles
CREATE OR REPLACE FUNCTION public.update_user_role_safe(target_user_id uuid, new_role_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can update roles';
  END IF;

  -- Validate the role text input - include all new roles
  IF new_role_text NOT IN ('admin', 'mst', 'fe', 'hk', 'se', 'assistant_manager', 'assistant_floor_manager', 'assistant_general_manager', 'assistant_vice_president', 'vp', 'ceo', 'cxo', 'tenant', 'vendor') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role_text;
  END IF;

  -- Update the user's role with proper casting
  UPDATE public.profiles 
  SET role = new_role_text::app_role,
      updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

-- Update assign_staff_to_zone function to allow L2 managers
CREATE OR REPLACE FUNCTION public.assign_staff_to_zone(p_staff_id uuid, p_zone_id uuid, p_department_id uuid, p_is_primary boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assignment_id UUID;
  caller_role TEXT;
BEGIN
  -- Check if caller is admin or L2/L3 manager
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF caller_role NOT IN ('admin', 'assistant_manager', 'assistant_floor_manager', 'assistant_general_manager', 'assistant_vice_president') THEN
    RAISE EXCEPTION 'Only administrators and managers can assign staff to zones';
  END IF;
  
  -- If this is set as primary, remove primary status from other assignments
  IF p_is_primary THEN
    UPDATE public.staff_area_assignments 
    SET is_primary = false 
    WHERE staff_id = p_staff_id AND is_primary = true;
  END IF;
  
  -- Insert or update assignment
  INSERT INTO public.staff_area_assignments (
    staff_id, zone_id, department_id, assigned_by, is_primary
  ) VALUES (
    p_staff_id, p_zone_id, p_department_id, auth.uid(), p_is_primary
  ) 
  ON CONFLICT (staff_id, zone_id) 
  DO UPDATE SET
    department_id = EXCLUDED.department_id,
    assigned_by = EXCLUDED.assigned_by,
    is_primary = EXCLUDED.is_primary,
    assigned_at = now(),
    is_active = true,
    updated_at = now()
  RETURNING id INTO assignment_id;
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(), 
    'assign_staff_to_zone', 
    'staff_area_assignment', 
    assignment_id,
    jsonb_build_object(
      'staff_id', p_staff_id,
      'zone_id', p_zone_id,
      'department_id', p_department_id,
      'is_primary', p_is_primary
    )
  );
  
  RETURN assignment_id;
END;
$$;