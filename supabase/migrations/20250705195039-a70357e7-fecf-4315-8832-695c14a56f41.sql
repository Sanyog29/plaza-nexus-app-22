-- Update get_user_management_data to accept user_id parameter
CREATE OR REPLACE FUNCTION public.get_user_management_data(caller_id uuid)
 RETURNS TABLE(id uuid, first_name text, last_name text, role text, created_at timestamp with time zone, updated_at timestamp with time zone, email text, confirmed_at timestamp with time zone, last_sign_in_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Check if the caller is an admin using the passed user ID
  IF NOT public.is_admin(caller_id) THEN
    RAISE EXCEPTION 'Only administrators can view user management data';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.role,
    p.created_at,
    p.updated_at,
    u.email,
    u.confirmed_at,
    u.last_sign_in_at
  FROM public.profiles p
  JOIN auth.users u ON p.id = u.id;
END;
$function$;