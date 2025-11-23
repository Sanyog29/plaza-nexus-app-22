-- Phase 1: Create function to automatically assign property from invitation
CREATE OR REPLACE FUNCTION public.handle_invitation_property_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Find matching invitation by email or phone
  SELECT * INTO invitation_record
  FROM public.user_invitations
  WHERE (NEW.email IS NOT NULL AND email = NEW.email)
     OR (NEW.phone IS NOT NULL AND mobile_number = NEW.phone)
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If invitation found and has property_id, create property assignment
  IF invitation_record.property_id IS NOT NULL THEN
    INSERT INTO public.property_assignments (
      user_id,
      property_id,
      is_primary,
      assigned_by
    ) VALUES (
      NEW.id,
      invitation_record.property_id,
      true,
      invitation_record.invited_by
    )
    ON CONFLICT (user_id, property_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for automatic property assignment
DROP TRIGGER IF EXISTS assign_property_from_invitation ON auth.users;
CREATE TRIGGER assign_property_from_invitation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitation_property_assignment();

-- Phase 2: Update approve_user function to handle property validation better
CREATE OR REPLACE FUNCTION public.approve_user(target_user_id uuid, approver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_property_id uuid;
  invitation_property_id uuid;
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
    
    -- Auto-create property assignment if user came from invitation with property
    SELECT property_id INTO invitation_property_id
    FROM public.user_invitations
    WHERE (email = (SELECT email FROM auth.users WHERE id = target_user_id))
       OR (mobile_number = (SELECT phone FROM auth.users WHERE id = target_user_id))
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF invitation_property_id IS NOT NULL THEN
      INSERT INTO public.property_assignments (user_id, property_id, is_primary, assigned_by)
      VALUES (target_user_id, invitation_property_id, true, approver_id)
      ON CONFLICT (user_id, property_id) DO NOTHING;
    END IF;
    
    RETURN jsonb_build_object('success', true, 'message', 'User approved successfully');
  END IF;
  
  -- Regular admins: check property assignment
  SELECT property_id INTO target_property_id
  FROM public.property_assignments
  WHERE user_id = target_user_id AND is_primary = true
  LIMIT 1;
  
  -- If no property assignment, check if admin can approve without it
  IF target_property_id IS NULL THEN
    -- Check if user has invitation with property
    SELECT property_id INTO invitation_property_id
    FROM public.user_invitations
    WHERE (email = (SELECT email FROM auth.users WHERE id = target_user_id))
       OR (mobile_number = (SELECT phone FROM auth.users WHERE id = target_user_id))
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF invitation_property_id IS NOT NULL THEN
      -- Create property assignment from invitation
      INSERT INTO public.property_assignments (user_id, property_id, is_primary, assigned_by)
      VALUES (target_user_id, invitation_property_id, true, approver_id)
      ON CONFLICT (user_id, property_id) DO NOTHING;
      
      target_property_id := invitation_property_id;
    END IF;
  END IF;
  
  -- If still no property, only super admins can approve
  IF target_property_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User must be assigned to a property before approval. Only super admins can approve users without properties.');
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

-- Phase 3: Assign default property to existing users without property assignments
-- Only assign to approved users to avoid issues
INSERT INTO public.property_assignments (user_id, property_id, is_primary, assigned_by)
SELECT 
  p.id as user_id,
  'b91ccd9a-56ca-4021-a7c2-ac7d24473bf1'::uuid as property_id, -- SS Plaza as default
  true as is_primary,
  (SELECT id FROM auth.users WHERE email LIKE '%admin%' ORDER BY created_at LIMIT 1) as assigned_by
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.property_assignments pa WHERE pa.user_id = p.id
)
AND p.approval_status = 'approved'
ON CONFLICT (user_id, property_id) DO NOTHING;