
-- Update admin_create_user_invitation to accept password and emp_id,
-- store mobile_number properly, and add validation.

-- 1) Replace the primary function (with specialization)
CREATE OR REPLACE FUNCTION public.admin_create_user_invitation(
  invitation_email text,
  invitation_first_name text,
  invitation_last_name text,
  invitation_role text,
  invitation_department text DEFAULT NULL,
  invitation_specialization text DEFAULT NULL,
  invitation_phone_number text DEFAULT NULL,
  invitation_office_number text DEFAULT NULL,
  invitation_floor text DEFAULT NULL,
  invitation_password text DEFAULT NULL,
  invitation_emp_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_profile RECORD;
  invitation_id uuid;
  invitation_token uuid;
  role_record RECORD;
  actual_app_role app_role;
  role_title_to_store text;
BEGIN
  -- Only admins
  SELECT * INTO caller_profile FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND OR caller_profile.role != 'admin' THEN
    RETURN jsonb_build_object('error', 'Only administrators can create user invitations');
  END IF;

  -- Validate password if provided
  IF invitation_password IS NOT NULL AND char_length(invitation_password) < 8 THEN
    RETURN jsonb_build_object('error', 'Password must be at least 8 characters');
  END IF;

  -- Check duplicates (email)
  IF invitation_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.users WHERE email = invitation_email AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('error', 'User with this email already exists');
  END IF;

  -- Check duplicates (mobile)
  IF invitation_phone_number IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.users WHERE phone = invitation_phone_number AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('error', 'User with this mobile number already exists');
  END IF;

  -- Resolve role (invitation_roles first, then enum)
  SELECT * INTO role_record
  FROM public.invitation_roles
  WHERE (title = invitation_role OR slug = invitation_role) 
    AND is_active = true;

  IF FOUND THEN
    actual_app_role := role_record.app_role;
    role_title_to_store := role_record.title;
  ELSE
    IF invitation_role = 'tenant' THEN
      IF EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'app_role' AND e.enumlabel = 'tenant'
      ) THEN
        actual_app_role := 'tenant'::app_role;
        role_title_to_store := 'Tenant';
      ELSIF EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'app_role' AND e.enumlabel = 'tenant_manager'
      ) THEN
        actual_app_role := 'tenant_manager'::app_role;
        role_title_to_store := 'Tenant Manager';
      ELSE
        RETURN jsonb_build_object('error', 'Invalid role specified');
      END IF;
    ELSE
      BEGIN
        actual_app_role := invitation_role::app_role;
        role_title_to_store := invitation_role;
      EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('error', 'Invalid role specified. Role must be from the approved invitation roles list.');
      END;
    END IF;
  END IF;

  -- Generate token
  invitation_token := gen_random_uuid();

  -- Create invitation record
  INSERT INTO public.user_invitations (
    email,
    mobile_number,
    first_name,
    last_name,
    role,
    role_title,
    department,
    specialization,
    office_number,
    floor,
    password,
    emp_id,
    invitation_token,
    invited_by,
    expires_at
  ) VALUES (
    invitation_email,
    invitation_phone_number,
    invitation_first_name,
    invitation_last_name,
    actual_app_role,
    role_title_to_store,
    invitation_department,
    invitation_specialization,
    invitation_office_number,
    invitation_floor,
    invitation_password,
    invitation_emp_id,
    invitation_token,
    auth.uid(),
    now() + interval '7 days'
  )
  RETURNING id INTO invitation_id;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(),
    'create_invitation',
    'user_invitation',
    invitation_id,
    jsonb_build_object(
      'email', invitation_email,
      'mobile_number', invitation_phone_number,
      'role', actual_app_role,
      'role_title', role_title_to_store,
      'department', invitation_department,
      'specialization', invitation_specialization,
      'emp_id', invitation_emp_id,
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
$$;

-- 2) Update the legacy overload (without specialization)
CREATE OR REPLACE FUNCTION public.admin_create_user_invitation(
  invitation_email text,
  invitation_first_name text,
  invitation_last_name text,
  invitation_role text,
  invitation_department text DEFAULT NULL,
  invitation_phone_number text DEFAULT NULL,
  invitation_office_number text DEFAULT NULL,
  invitation_floor text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.admin_create_user_invitation(
    invitation_email,
    invitation_first_name,
    invitation_last_name,
    invitation_role,
    invitation_department,
    NULL, -- invitation_specialization
    invitation_phone_number,
    invitation_office_number,
    invitation_floor,
    NULL, -- invitation_password
    NULL  -- invitation_emp_id
  );
END;
$$;
