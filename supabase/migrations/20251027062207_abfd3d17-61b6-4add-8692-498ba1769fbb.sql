-- Add property_id to user_invitations table
ALTER TABLE public.user_invitations
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL;

-- Update admin_create_user_invitation RPC to handle property assignment
CREATE OR REPLACE FUNCTION public.admin_create_user_invitation(
  invitation_email text,
  invitation_first_name text,
  invitation_last_name text,
  invitation_role text,
  invitation_department text DEFAULT NULL::text,
  invitation_specialization text DEFAULT NULL::text,
  invitation_phone_number text DEFAULT NULL::text,
  invitation_office_number text DEFAULT NULL::text,
  invitation_floor text DEFAULT NULL::text,
  invitation_property_id uuid DEFAULT NULL::uuid,
  invitation_password text DEFAULT NULL::text,
  invitation_emp_id text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_profile RECORD;
  invitation_id uuid;
  invitation_token uuid;
  role_record RECORD;
  actual_app_role app_role;
  role_title_to_store text;
BEGIN
  -- Check caller is admin
  SELECT * INTO caller_profile
  FROM public.user_roles
  WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin');
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Only administrators can create user invitations');
  END IF;
  
  -- Check if user already exists
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = invitation_email AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('error', 'User with this email already exists');
  END IF;
  
  -- Resolve role
  SELECT * INTO role_record
  FROM public.invitation_roles
  WHERE (title = invitation_role OR slug = invitation_role) 
    AND is_active = true;
  
  IF FOUND THEN
    actual_app_role := role_record.app_role;
    role_title_to_store := role_record.title;
  ELSE
    -- Fallback for tenant role
    IF invitation_role = 'tenant' THEN
      IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'app_role' AND e.enumlabel = 'tenant'
      ) THEN
        actual_app_role := 'tenant'::app_role;
        role_title_to_store := 'Tenant';
      ELSIF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
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
  
  -- Generate invitation token
  invitation_token := gen_random_uuid();
  
  -- Insert invitation with property_id
  INSERT INTO public.user_invitations (
    email,
    first_name,
    last_name,
    role,
    role_title,
    department,
    specialization,
    phone_number,
    office_number,
    floor,
    property_id,
    invitation_token,
    invited_by,
    expires_at
  ) VALUES (
    invitation_email,
    invitation_first_name,
    invitation_last_name,
    actual_app_role,
    role_title_to_store,
    invitation_department,
    invitation_specialization,
    invitation_phone_number,
    invitation_office_number,
    invitation_floor,
    invitation_property_id,
    invitation_token,
    auth.uid(),
    now() + interval '7 days'
  ) RETURNING id INTO invitation_id;
  
  -- Log audit event
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(),
    'create_invitation',
    'user_invitation',
    invitation_id,
    jsonb_build_object(
      'email', invitation_email,
      'role', actual_app_role,
      'role_title', role_title_to_store,
      'department', invitation_department,
      'specialization', invitation_specialization,
      'property_id', invitation_property_id,
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