-- Fix get_user_management_data function to use LEFT JOIN and return all fields
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
  emp_id text,
  phone_number text,
  office_number text,
  floor text,
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
    COALESCE(p.department, '')::text as department,
    COALESCE(p.specialization, '')::text as specialization,
    COALESCE(p.emp_id, '')::text as emp_id,
    COALESCE(p.phone_number, u.phone, '')::text as phone_number,
    COALESCE(p.office_number, '')::text as office_number,
    COALESCE(p.floor, '')::text as floor,
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

-- Create a one-time backfill for missing profiles
INSERT INTO public.profiles (
  id, 
  first_name, 
  last_name, 
  role, 
  assigned_role_title,
  department,
  specialization,
  emp_id,
  phone_number,
  office_number,
  floor,
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
  u.raw_user_meta_data ->> 'emp_id' as emp_id,
  COALESCE(u.raw_user_meta_data ->> 'phone_number', u.phone) as phone_number,
  u.raw_user_meta_data ->> 'office_number' as office_number,
  u.raw_user_meta_data ->> 'floor' as floor,
  'pending'::approval_status as approval_status,
  u.created_at,
  u.updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.deleted_at IS NULL 
  AND p.id IS NULL
ON CONFLICT (id) DO NOTHING;