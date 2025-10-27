-- Update the trigger function to use is_admin_secure instead of is_admin
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Non-admins and non-super_admins cannot change security-critical fields
  IF NOT public.is_admin_secure(auth.uid()) THEN
    -- Only check approval-related fields, NOT role (role is now in user_roles table)
    IF (OLD.approval_status IS DISTINCT FROM NEW.approval_status) OR
       (OLD.approved_by IS DISTINCT FROM NEW.approved_by) OR
       (OLD.approved_at IS DISTINCT FROM NEW.approved_at) OR
       (OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason) THEN
      RAISE EXCEPTION 'Access denied: Only administrators or super administrators can modify approval fields';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.approve_user(uuid, uuid);
DROP FUNCTION IF EXISTS public.reject_user(uuid, uuid, text);

-- Create helper functions for approval/rejection with property scoping
CREATE FUNCTION public.approve_user(target_user_id uuid, approver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_property_id uuid;
BEGIN
  -- Super admins can approve anyone
  IF public.is_super_admin(approver_id) THEN
    UPDATE public.profiles
    SET 
      approval_status = 'approved',
      approved_by = approver_id,
      approved_at = now(),
      rejection_reason = NULL
    WHERE id = target_user_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'User approved successfully');
  END IF;
  
  -- Regular admins need property access
  SELECT property_id INTO target_property_id
  FROM public.property_assignments
  WHERE user_id = target_user_id AND is_primary = true
  LIMIT 1;
  
  -- If user has no property, admin cannot approve
  IF target_property_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User has no property assignment. Only super admins can approve users without properties.');
  END IF;
  
  -- Check if admin has access to the target property
  IF NOT public.user_has_property_access(approver_id, target_property_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admins can only approve users in their assigned properties');
  END IF;
  
  UPDATE public.profiles
  SET 
    approval_status = 'approved',
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = NULL
  WHERE id = target_user_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'User approved successfully');
END;
$function$;

CREATE FUNCTION public.reject_user(target_user_id uuid, approver_id uuid, reason text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_property_id uuid;
BEGIN
  -- Super admins can reject anyone
  IF public.is_super_admin(approver_id) THEN
    UPDATE public.profiles
    SET 
      approval_status = 'rejected',
      approved_by = approver_id,
      approved_at = now(),
      rejection_reason = reason
    WHERE id = target_user_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'User rejected successfully');
  END IF;
  
  -- Regular admins need property access for rejection
  SELECT property_id INTO target_property_id
  FROM public.property_assignments
  WHERE user_id = target_user_id AND is_primary = true
  LIMIT 1;
  
  -- Allow rejection even without property (admins can reject anyone to prevent unauthorized access)
  IF target_property_id IS NOT NULL THEN
    -- If user has property, check admin has access
    IF NOT public.user_has_property_access(approver_id, target_property_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Admins can only reject users in their assigned properties');
    END IF;
  END IF;
  
  UPDATE public.profiles
  SET 
    approval_status = 'rejected',
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = reason
  WHERE id = target_user_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'User rejected successfully');
END;
$function$;