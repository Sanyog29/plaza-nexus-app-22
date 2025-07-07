-- Create the function with caller_id parameter as expected by the code
CREATE OR REPLACE FUNCTION public.get_user_management_data(caller_id uuid)
 RETURNS TABLE(id uuid, first_name text, last_name text, role text, created_at timestamp with time zone, updated_at timestamp with time zone, email text, confirmed_at timestamp with time zone, last_sign_in_at timestamp with time zone)
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
    p.id,
    COALESCE(p.first_name, '')::text as first_name,
    COALESCE(p.last_name, '')::text as last_name,
    p.role::text,
    p.created_at,
    p.updated_at,
    COALESCE(u.email, '')::text as email,
    u.confirmed_at,
    u.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$function$