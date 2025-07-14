-- Drop and recreate the get_user_management_data function with the new signature
DROP FUNCTION IF EXISTS public.get_user_management_data(uuid);

-- Create the updated function that shows all users, even without profiles
CREATE OR REPLACE FUNCTION public.get_user_management_data(caller_id uuid)
RETURNS TABLE(
  id uuid, 
  first_name text, 
  last_name text, 
  role text, 
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
SET search_path TO ''
AS $function$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.is_admin(caller_id) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view user management data';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    COALESCE(p.first_name, '')::text as first_name,
    COALESCE(p.last_name, '')::text as last_name,
    COALESCE(p.role::text, 'tenant_manager') as role,
    COALESCE(p.approval_status::text, 'pending') as approval_status,
    p.approved_by,
    p.approved_at,
    p.rejection_reason,
    COALESCE(p.created_at, u.created_at) as created_at,
    COALESCE(p.updated_at, u.updated_at) as updated_at,
    COALESCE(u.email, '')::text as email,
    u.confirmed_at,
    u.last_sign_in_at,
    (p.id IS NOT NULL) as has_profile
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.deleted_at IS NULL
  ORDER BY COALESCE(p.created_at, u.created_at) DESC;
END;
$function$;