-- Fix get_user_management_data function with actual profile columns
DROP FUNCTION IF EXISTS public.get_user_management_data();

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
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  email text, 
  confirmed_at timestamp with time zone, 
  last_sign_in_at timestamp with time zone,
  approval_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view user management data';
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(p.id, u.id) as id,
    COALESCE(p.first_name, u.raw_user_meta_data ->> 'first_name', '')::text as first_name,
    COALESCE(p.last_name, u.raw_user_meta_data ->> 'last_name', '')::text as last_name,
    COALESCE(p.role::text, 'tenant')::text as role,
    COALESCE(p.assigned_role_title, p.role::text, 'tenant')::text as assigned_role_title,
    COALESCE(p.department, u.raw_user_meta_data ->> 'department', '')::text as department,
    COALESCE(p.specialization, u.raw_user_meta_data ->> 'specialization', '')::text as specialization,
    COALESCE(p.phone_number, u.phone, u.raw_user_meta_data ->> 'phone_number', '')::text as phone_number,
    COALESCE(p.created_at, u.created_at) as created_at,
    COALESCE(p.updated_at, u.updated_at) as updated_at,
    COALESCE(u.email, '')::text as email,
    u.confirmed_at,
    u.last_sign_in_at,
    COALESCE(p.approval_status::text, 'pending')::text as approval_status
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.deleted_at IS NULL
  ORDER BY COALESCE(p.created_at, u.created_at) DESC;
END;
$function$;

-- Create a simple backfill for missing profiles with basic fields only
INSERT INTO public.profiles (
  id, 
  first_name, 
  last_name, 
  role,
  assigned_role_title,
  department,
  specialization,
  phone_number,
  approval_status,
  created_at,
  updated_at
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'first_name', '') as first_name,
  COALESCE(u.raw_user_meta_data ->> 'last_name', '') as last_name,
  COALESCE((u.raw_user_meta_data ->> 'role')::app_role, 'tenant') as role,
  COALESCE(u.raw_user_meta_data ->> 'role', 'tenant') as assigned_role_title,
  u.raw_user_meta_data ->> 'department' as department,
  u.raw_user_meta_data ->> 'specialization' as specialization,
  COALESCE(u.raw_user_meta_data ->> 'phone_number', u.phone) as phone_number,
  'pending'::approval_status as approval_status,
  u.created_at,
  u.updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.deleted_at IS NULL 
  AND p.id IS NULL
ON CONFLICT (id) DO NOTHING;