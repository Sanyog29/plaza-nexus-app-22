-- Fix the update_user_role function to accept caller_id parameter
CREATE OR REPLACE FUNCTION public.update_user_role(user_id uuid, new_role text, caller_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.is_admin(caller_id) THEN
    RAISE EXCEPTION 'Only administrators can update roles';
  END IF;

  -- Update the user's role
  UPDATE public.profiles 
  SET role = new_role,
      updated_at = now()
  WHERE id = user_id;

  RETURN FOUND;
END;
$function$;