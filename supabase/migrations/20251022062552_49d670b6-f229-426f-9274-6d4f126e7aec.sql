-- Ensure function return structure matches query with explicit casts
CREATE OR REPLACE FUNCTION public.get_user_management_data()
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
  -- Admin check using fully qualified role reference
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND user_roles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  -- Return user data with explicit casts to match declared return types
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
    (p.id IS NOT NULL)::boolean AS has_profile
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  LEFT JOIN public.user_roles ur ON au.id = ur.user_id
  WHERE au.aud = 'authenticated'
    AND au.deleted_at IS NULL
  ORDER BY au.created_at DESC;
END;
$$;