-- Fix admin_create_user_invitation function to properly cast role parameter
CREATE OR REPLACE FUNCTION public.admin_create_user_invitation(invitation_email text, invitation_first_name text, invitation_last_name text, invitation_role text, invitation_department text DEFAULT NULL::text, invitation_phone_number text DEFAULT NULL::text, invitation_office_number text DEFAULT NULL::text, invitation_floor text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  caller_profile RECORD;
  invitation_id uuid;
  invitation_token uuid;
BEGIN
  -- Check if caller is admin
  SELECT * INTO caller_profile
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF NOT FOUND OR caller_profile.role != 'admin' THEN
    RETURN jsonb_build_object('error', 'Only administrators can create user invitations');
  END IF;
  
  -- Validate role
  IF invitation_role NOT IN ('admin', 'ops_supervisor', 'field_staff', 'tenant_manager', 'vendor') THEN
    RETURN jsonb_build_object('error', 'Invalid role specified');
  END IF;
  
  -- Check if user already exists
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = invitation_email AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('error', 'User with this email already exists');
  END IF;
  
  -- Generate invitation token
  invitation_token := gen_random_uuid();
  
  -- Create invitation record with proper role casting
  INSERT INTO public.user_invitations (
    email,
    first_name,
    last_name,
    role,
    department,
    phone_number,
    office_number,
    floor,
    invitation_token,
    invited_by,
    expires_at
  ) VALUES (
    invitation_email,
    invitation_first_name,
    invitation_last_name,
    invitation_role::app_role,
    invitation_department,
    invitation_phone_number,
    invitation_office_number,
    invitation_floor,
    invitation_token,
    auth.uid(),
    now() + interval '7 days'
  ) RETURNING id INTO invitation_id;
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(),
    'create_invitation',
    'user_invitation',
    invitation_id,
    jsonb_build_object(
      'email', invitation_email,
      'role', invitation_role,
      'invited_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User invitation created successfully',
    'invitation_id', invitation_id,
    'invitation_token', invitation_token
  );
END;
$function$