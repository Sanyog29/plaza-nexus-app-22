-- Drop and recreate get_user_management_data with property information
DROP FUNCTION IF EXISTS public.get_user_management_data();

CREATE FUNCTION public.get_user_management_data()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  role text,
  assigned_role_title text,
  department text,
  specialization text,
  phone_number text,
  approval_status text,
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz,
  updated_at timestamptz,
  email text,
  confirmed_at timestamptz,
  last_sign_in_at timestamptz,
  has_profile boolean,
  property_id uuid,
  property_name text,
  is_primary boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Admin check - includes both admin and super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Return user data with property information
  RETURN QUERY
  SELECT 
    au.id::uuid,
    COALESCE(p.first_name, '')::text AS first_name,
    COALESCE(p.last_name, '')::text AS last_name,
    COALESCE(ur.role::text, '')::text AS role,
    COALESCE(p.assigned_role_title, ur.role::text, '')::text AS assigned_role_title,
    COALESCE(p.department, '')::text AS department,
    COALESCE(p.specialization, '')::text AS specialization,
    COALESCE(p.phone_number, '')::text AS phone_number,
    COALESCE(p.approval_status::text, 'pending')::text AS approval_status,
    p.approved_by::uuid AS approved_by,
    p.approved_at::timestamptz AS approved_at,
    COALESCE(p.rejection_reason, '')::text AS rejection_reason,
    au.created_at::timestamptz AS created_at,
    au.updated_at::timestamptz AS updated_at,
    COALESCE(au.email, '')::text AS email,
    au.confirmed_at::timestamptz AS confirmed_at,
    au.last_sign_in_at::timestamptz AS last_sign_in_at,
    (p.id IS NOT NULL)::boolean AS has_profile,
    pa.property_id::uuid AS property_id,
    prop.name::text AS property_name,
    COALESCE(pa.is_primary, false)::boolean AS is_primary
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  LEFT JOIN public.property_assignments pa ON au.id = pa.user_id AND pa.is_primary = true
  LEFT JOIN public.properties prop ON pa.property_id = prop.id
  WHERE au.aud = 'authenticated'
    AND au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$$;

-- Function to update user's property assignment
CREATE OR REPLACE FUNCTION public.update_user_property_assignment(
  target_user_id uuid,
  new_property_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Check caller is admin or super_admin
  SELECT ur.role::text INTO caller_role
  FROM user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin');
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only administrators can update property assignments');
  END IF;
  
  -- Check if property exists
  IF NOT EXISTS (SELECT 1 FROM properties WHERE id = new_property_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Property not found');
  END IF;
  
  -- Update or insert property assignment (set as primary)
  INSERT INTO property_assignments (user_id, property_id, is_primary, assigned_by)
  VALUES (target_user_id, new_property_id, true, auth.uid())
  ON CONFLICT (user_id, property_id) DO UPDATE
  SET is_primary = true, assigned_by = auth.uid(), assigned_at = now();
  
  -- Set all other assignments for this user to non-primary
  UPDATE property_assignments
  SET is_primary = false
  WHERE user_id = target_user_id AND property_id != new_property_id;
  
  -- Log audit event
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(),
    'update_property_assignment',
    'property_assignment',
    target_user_id,
    jsonb_build_object(
      'user_id', target_user_id,
      'property_id', new_property_id,
      'assigned_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Property assignment updated successfully');
END;
$$;