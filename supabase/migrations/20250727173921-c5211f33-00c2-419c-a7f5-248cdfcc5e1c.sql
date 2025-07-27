-- Phase 1: Database Schema Enhancement for Better Department Management

-- Add specialization column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS specialization text;

-- Create departments reference table for better data consistency
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  parent_department_id uuid REFERENCES public.departments(id),
  is_active boolean NOT NULL DEFAULT true,
  specializations text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on departments table
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for departments table
CREATE POLICY "Anyone can view active departments" 
ON public.departments 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage departments" 
ON public.departments 
FOR ALL 
USING (is_admin(auth.uid()));

-- Insert default departments with specializations
INSERT INTO public.departments (name, description, specializations) VALUES
('Facilities Management', 'Overall facility operations and maintenance', ARRAY['General Maintenance', 'Building Operations']),
('Technical Services', 'Specialized technical maintenance', ARRAY['HVAC', 'Electrical', 'Plumbing', 'IT Support']),
('Security & Safety', 'Security operations and safety management', ARRAY['Security', 'Safety', 'Emergency Response']),
('Cleaning Services', 'Cleaning and janitorial services', ARRAY['Cleaning', 'Waste Management', 'Hygiene']),
('Administration', 'Administrative and management functions', ARRAY['Management', 'HR', 'Finance']),
('Operations', 'Day-to-day operational activities', ARRAY['Operations Supervision', 'Field Operations'])
ON CONFLICT (name) DO NOTHING;

-- Update the admin_create_user_invitation function to support specialization
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
  
  -- Create invitation record with proper role casting and new specialization field
  INSERT INTO public.user_invitations (
    email,
    first_name,
    last_name,
    role,
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
    invitation_role::app_role,
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
      'role', invitation_role,
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
$function$;

-- Add specialization column to user_invitations table if it doesn't exist
ALTER TABLE public.user_invitations 
ADD COLUMN IF NOT EXISTS specialization text;

-- Update the handle_new_user function to support specialization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert profile with better error handling and specialization support
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    role, 
    approval_status,
    department,
    specialization,
    phone_number,
    office_number,
    floor
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'tenant_manager'::app_role),
    'pending'::approval_status,
    NEW.raw_user_meta_data ->> 'department',
    NEW.raw_user_meta_data ->> 'specialization',
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'office_number',
    NEW.raw_user_meta_data ->> 'floor'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    department = COALESCE(EXCLUDED.department, profiles.department),
    specialization = COALESCE(EXCLUDED.specialization, profiles.specialization),
    updated_at = now();
    
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't block user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;