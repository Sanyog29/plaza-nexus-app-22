-- Create user invitation system and notification preferences tables

-- User invitations table for pending user creation
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  role app_role NOT NULL DEFAULT 'tenant_manager',
  department TEXT,
  phone_number TEXT,
  office_number TEXT,
  floor TEXT,
  invitation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  invited_by UUID REFERENCES public.profiles(id) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for user invitations
CREATE POLICY "Admins can manage all invitations"
ON public.user_invitations
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view invitations they sent"
ON public.user_invitations
FOR SELECT
USING (invited_by = auth.uid());

-- User notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  email_notifications BOOLEAN DEFAULT true,
  maintenance_alerts BOOLEAN DEFAULT true,
  visitor_notifications BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  system_announcements BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences"
ON public.user_notification_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification preferences"
ON public.user_notification_preferences
FOR SELECT
USING (is_admin(auth.uid()));

-- User onboarding status table
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  profile_completed BOOLEAN DEFAULT false,
  tour_completed BOOLEAN DEFAULT false,
  training_assigned JSONB DEFAULT '[]',
  training_completed JSONB DEFAULT '[]',
  welcome_email_sent BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

-- RLS policies for user onboarding
CREATE POLICY "Users can view their own onboarding status"
ON public.user_onboarding
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding status"
ON public.user_onboarding
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all onboarding"
ON public.user_onboarding
FOR ALL
USING (is_admin(auth.uid()));

-- Function to create user invitation
CREATE OR REPLACE FUNCTION public.create_user_invitation(
  invitation_email TEXT,
  invitation_first_name TEXT DEFAULT NULL,
  invitation_last_name TEXT DEFAULT NULL,
  invitation_role app_role DEFAULT 'tenant_manager',
  invitation_department TEXT DEFAULT NULL,
  invitation_phone_number TEXT DEFAULT NULL,
  invitation_office_number TEXT DEFAULT NULL,
  invitation_floor TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_id UUID;
  existing_user_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can create user invitations';
  END IF;

  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = invitation_email;
  
  IF existing_user_id IS NOT NULL THEN
    RAISE EXCEPTION 'User with email % already exists', invitation_email;
  END IF;

  -- Check if invitation already exists and is pending
  SELECT id INTO invitation_id
  FROM public.user_invitations
  WHERE email = invitation_email AND status = 'pending';
  
  IF invitation_id IS NOT NULL THEN
    RAISE EXCEPTION 'Pending invitation already exists for email %', invitation_email;
  END IF;

  -- Create the invitation
  INSERT INTO public.user_invitations (
    email, first_name, last_name, role, department, 
    phone_number, office_number, floor, invited_by
  ) VALUES (
    invitation_email, invitation_first_name, invitation_last_name, 
    invitation_role, invitation_department, invitation_phone_number, 
    invitation_office_number, invitation_floor, auth.uid()
  ) RETURNING id INTO invitation_id;

  -- Log the invitation creation
  PERFORM public.log_audit_event(
    'user_invited',
    'user_invitation',
    invitation_id,
    NULL,
    jsonb_build_object(
      'email', invitation_email,
      'role', invitation_role,
      'invited_by', auth.uid()
    )
  );

  RETURN invitation_id;
END;
$$;

-- Function to accept user invitation
CREATE OR REPLACE FUNCTION public.accept_user_invitation(
  invitation_token UUID,
  user_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  new_user_id UUID;
  profile_id UUID;
BEGIN
  -- Get invitation details
  SELECT * INTO invitation_record
  FROM public.user_invitations
  WHERE invitation_token = accept_user_invitation.invitation_token
    AND status = 'pending'
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  -- Create the user account (this would typically be done via Supabase Auth API)
  -- For now, we'll return the data needed for the frontend to create the user
  
  -- Mark invitation as accepted
  UPDATE public.user_invitations
  SET status = 'accepted',
      updated_at = now()
  WHERE invitation_token = accept_user_invitation.invitation_token;

  -- Return invitation data for user creation
  RETURN jsonb_build_object(
    'email', invitation_record.email,
    'first_name', invitation_record.first_name,
    'last_name', invitation_record.last_name,
    'role', invitation_record.role,
    'department', invitation_record.department,
    'phone_number', invitation_record.phone_number,
    'office_number', invitation_record.office_number,
    'floor', invitation_record.floor
  );
END;
$$;

-- Function to initialize user onboarding
CREATE OR REPLACE FUNCTION public.initialize_user_onboarding(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role app_role;
  training_modules JSONB;
BEGIN
  -- Get user role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = target_user_id;
  
  -- Define training modules based on role
  training_modules := CASE user_role
    WHEN 'admin' THEN '["system_administration", "user_management", "security_protocols", "analytics_dashboard"]'::JSONB
    WHEN 'ops_supervisor' THEN '["operations_management", "staff_coordination", "reporting", "sla_management"]'::JSONB
    WHEN 'field_staff' THEN '["maintenance_procedures", "safety_protocols", "mobile_app_usage", "reporting"]'::JSONB
    WHEN 'staff' THEN '["basic_procedures", "safety_protocols", "mobile_app_usage"]'::JSONB
    WHEN 'tenant_manager' THEN '["request_management", "booking_system", "communication"]'::JSONB
    WHEN 'vendor' THEN '["vendor_portal", "compliance", "reporting"]'::JSONB
    ELSE '["basic_orientation"]'::JSONB
  END;

  -- Create onboarding record
  INSERT INTO public.user_onboarding (
    user_id,
    training_assigned
  ) VALUES (
    target_user_id,
    training_modules
  ) ON CONFLICT (user_id) DO UPDATE SET
    training_assigned = training_modules,
    updated_at = now();

  -- Create default notification preferences
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Update the handle_new_user function to include onboarding initialization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (new.id, '', '', 'tenant_manager'::app_role);
  
  -- Initialize onboarding
  PERFORM public.initialize_user_onboarding(new.id);
  
  RETURN new;
END;
$$;

-- Create trigger for automatic onboarding initialization
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();