-- Fix get_user_management_data function to use user_roles table

-- Drop all versions of the function
DROP FUNCTION IF EXISTS public.get_user_management_data();
DROP FUNCTION IF EXISTS public.get_user_management_data(uuid);

-- Recreate with correct user_roles JOIN
CREATE OR REPLACE FUNCTION public.get_user_management_data(caller_id uuid)
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
  has_profile boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = caller_id 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Return user data with role from user_roles table
  RETURN QUERY
  SELECT 
    au.id,
    COALESCE(p.first_name, '') as first_name,
    COALESCE(p.last_name, '') as last_name,
    COALESCE(ur.role::text, '') as role,  -- Get from user_roles table
    COALESCE(p.assigned_role_title, ur.role::text, '') as assigned_role_title,
    COALESCE(p.department, '') as department,
    COALESCE(p.specialization, '') as specialization,
    COALESCE(p.phone_number, '') as phone_number,
    COALESCE(p.approval_status, 'pending') as approval_status,
    p.approved_by,
    p.approved_at,
    p.rejection_reason,
    au.created_at,
    au.updated_at,
    COALESCE(au.email, '') as email,
    au.confirmed_at,
    au.last_sign_in_at,
    (p.id IS NOT NULL) as has_profile
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id  -- Join user_roles for role
  WHERE au.aud = 'authenticated'
  ORDER BY au.created_at DESC;
END;
$$;