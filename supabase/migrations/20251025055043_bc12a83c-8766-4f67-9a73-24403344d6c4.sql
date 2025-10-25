-- Fix prevent_profile_privilege_escalation trigger to remove role field references
-- The role field was removed from profiles table as a security fix
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Non-admins cannot change security-critical fields
  IF NOT public.is_admin(auth.uid()) THEN
    -- Only check approval-related fields, NOT role (role is now in user_roles table)
    IF (OLD.approval_status IS DISTINCT FROM NEW.approval_status) OR
       (OLD.approved_by IS DISTINCT FROM NEW.approved_by) OR
       (OLD.approved_at IS DISTINCT FROM NEW.approved_at) OR
       (OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason) THEN
      RAISE EXCEPTION 'Access denied: Only administrators can modify approval fields';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;