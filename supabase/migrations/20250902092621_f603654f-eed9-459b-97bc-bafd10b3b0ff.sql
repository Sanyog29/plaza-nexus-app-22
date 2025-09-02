-- 1) Create invitation_roles table to store allowed roles dynamically
CREATE TABLE public.invitation_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  app_role app_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_specialization BOOLEAN NOT NULL DEFAULT false,
  color_class TEXT DEFAULT 'bg-primary',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitation_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage invitation roles" 
ON public.invitation_roles 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view active invitation roles" 
ON public.invitation_roles 
FOR SELECT 
USING (is_active = true);

-- 2) Add role_title column to user_invitations
ALTER TABLE public.user_invitations 
ADD COLUMN role_title TEXT;

-- 3) Insert the allowed roles
INSERT INTO public.invitation_roles (title, slug, app_role, requires_specialization, sort_order) VALUES
('Senior Manager - Business Development', 'senior_manager_bd', 'admin', false, 1),
('MST', 'mst', 'mst', true, 2),
('Technical Executive', 'technical_executive', 'fe', true, 3),
('Asst. Project Manager - Operations', 'asst_project_manager_ops', 'assistant_manager', false, 4),
('BMS Executive - Operations', 'bms_executive_ops', 'fe', true, 5),
('Front desk and Facility Executive', 'front_desk_facility_executive', 'fe', false, 6),
('Senior Manager - Operations', 'senior_manager_ops', 'admin', false, 7),
('Assistant Manager - Operations', 'assistant_manager_ops', 'assistant_manager', false, 8),
('Intern - Business Development', 'intern_bd', 'fe', false, 9),
('Site Engineer', 'site_engineer', 'se', true, 10),
('Executive - Operations', 'executive_ops', 'fe', false, 11),
('Junior Executive', 'junior_executive', 'fe', false, 12),
('Multi Skilled Technician', 'multi_skilled_technician', 'mst', true, 13),
('Assistant Manager', 'assistant_manager', 'assistant_manager', false, 14),
('Senior Designer - Design', 'senior_designer', 'fe', true, 15),
('Assistant Manager - Business Development & Growth - Bangalore', 'asst_manager_bd_bangalore', 'assistant_manager', false, 16),
('Assistant General Manager', 'assistant_general_manager', 'assistant_general_manager', false, 17),
('Security Supervisor', 'security_supervisor', 'assistant_manager', false, 18),
('BMS Operator', 'bms_operator', 'fe', true, 19),
('Chief Executive Officer', 'ceo', 'ceo', false, 20),
('General Manager', 'general_manager', 'assistant_general_manager', false, 21),
('Tenant', 'tenant', 'tenant_manager', false, 22),
('Tenant Manager', 'tenant_manager', 'tenant_manager', false, 23);

-- 4) Update admin_create_user_invitation function
CREATE OR REPLACE FUNCTION public.admin_create_user_invitation(
  invitation_email text,
  invitation_first_name text,
  invitation_last_name text,
  invitation_role text,
  invitation_department text DEFAULT NULL,
  invitation_specialization text DEFAULT NULL,
  invitation_phone_number text DEFAULT NULL,
  invitation_office_number text DEFAULT NULL,
  invitation_floor text DEFAULT NULL
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
  -- Check if caller is admin
  SELECT * INTO caller_profile
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF NOT FOUND OR caller_profile.role != 'admin' THEN
    RETURN jsonb_build_object('error', 'Only administrators can create user invitations');
  END IF;
  
  -- Check if user already exists
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = invitation_email AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('error', 'User with this email already exists');
  END IF;
  
  -- Try to find role in invitation_roles table first
  SELECT * INTO role_record
  FROM public.invitation_roles
  WHERE (title = invitation_role OR slug = invitation_role) 
    AND is_active = true;
  
  IF FOUND THEN
    -- Use the role from invitation_roles
    actual_app_role := role_record.app_role;
    role_title_to_store := role_record.title;
  ELSE
    -- Special handling for "tenant" if not found in invitation_roles
    IF invitation_role = 'tenant' THEN
      -- Check if 'tenant' exists in app_role enum
      IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'app_role' AND e.enumlabel = 'tenant'
      ) THEN
        actual_app_role := 'tenant'::app_role;
        role_title_to_store := 'Tenant';
      -- Check if 'tenant_manager' exists in app_role enum
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
      -- Try direct app_role enum validation
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
  
  -- Create invitation record
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
      'role', actual_app_role,
      'role_title', role_title_to_store,
      'department', invitation_department,
      'specialization', invitation_specialization,
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

-- 5) Replace the legacy overload (without specialization)
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
    invitation_floor
  );
END;
$$;