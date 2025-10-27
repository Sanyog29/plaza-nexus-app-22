-- Fix property isolation in user management
-- This ensures admins only see users from properties they have access to

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_user_management_data();

-- Recreate with property scoping
CREATE OR REPLACE FUNCTION public.get_user_management_data(filter_property_id uuid DEFAULT NULL)
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
   approved_at timestamp with time zone,
   rejection_reason text,
   created_at timestamp with time zone,
   updated_at timestamp with time zone,
   email text,
   confirmed_at timestamp with time zone,
   last_sign_in_at timestamp with time zone,
   has_profile boolean,
   property_id uuid,
   property_name text,
   is_primary boolean
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  is_super_admin boolean;
BEGIN
  -- Check if user is admin (includes both admin and super_admin)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Check if user is super_admin
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND user_roles.role = 'super_admin'
  ) INTO is_super_admin;

  -- Return user data with property-based filtering
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
    -- Property isolation logic
    AND (
      -- Super admins see all users when no filter is passed
      (is_super_admin AND filter_property_id IS NULL)
      OR
      -- Super admins with explicit property filter
      (is_super_admin AND filter_property_id IS NOT NULL AND (pa.property_id = filter_property_id OR (filter_property_id IS NULL AND pa.property_id IS NULL)))
      OR
      -- Regular admins only see users from their assigned property
      (NOT is_super_admin AND filter_property_id IS NOT NULL AND pa.property_id = filter_property_id)
      OR
      -- Include users with no property assignment only for unassigned filter
      (pa.property_id IS NULL AND filter_property_id IS NULL)
    )
  ORDER BY au.created_at DESC;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_user_management_data(uuid) IS 
'Returns user management data with property-based access control. Super admins see all users, regular admins only see users from their assigned properties.';