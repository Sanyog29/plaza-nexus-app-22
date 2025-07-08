-- Fix the role update issue by creating a proper role update function
CREATE OR REPLACE FUNCTION public.update_user_role_safe(target_user_id uuid, new_role_text text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can update roles';
  END IF;

  -- Validate the role text input
  IF new_role_text NOT IN ('admin', 'ops_supervisor', 'field_staff', 'tenant_manager', 'vendor') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role_text;
  END IF;

  -- Update the user's role with proper casting
  UPDATE public.profiles 
  SET role = new_role_text::app_role,
      updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;