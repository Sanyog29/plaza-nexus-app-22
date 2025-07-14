-- Phase 1: Improve profile trigger to handle edge cases
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert profile with better error handling
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    role, 
    approval_status,
    department,
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
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'office_number',
    NEW.raw_user_meta_data ->> 'floor'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    updated_at = now();
    
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't block user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Phase 2: Fix existing users without profiles
INSERT INTO public.profiles (id, first_name, last_name, role, approval_status)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'first_name', ''),
  COALESCE(u.raw_user_meta_data ->> 'last_name', ''),
  COALESCE((u.raw_user_meta_data ->> 'role')::app_role, 'tenant_manager'::app_role),
  'pending'::approval_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;

-- Phase 3: Create better user deletion function (RPC)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_profile RECORD;
  target_profile RECORD;
  result jsonb;
BEGIN
  -- Check if caller is admin
  SELECT * INTO caller_profile
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF NOT FOUND OR caller_profile.role != 'admin' THEN
    RETURN jsonb_build_object('error', 'Only administrators can delete users');
  END IF;
  
  -- Prevent self-deletion
  IF target_user_id = auth.uid() THEN
    RETURN jsonb_build_object('error', 'Cannot delete your own account');
  END IF;
  
  -- Get target user info
  SELECT * INTO target_profile
  FROM public.profiles
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  -- Delete from auth.users (cascade will handle profiles)
  -- Note: This requires service role permissions
  -- For now, we'll mark as deleted in profiles and let Edge Function handle auth deletion
  UPDATE public.profiles
  SET 
    approval_status = 'rejected',
    rejection_reason = 'Account deleted by admin',
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(),
    'delete_user',
    'user',
    target_user_id,
    jsonb_build_object('deleted_by', auth.uid(), 'deleted_at', now())
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User marked for deletion successfully',
    'user_id', target_user_id
  );
END;
$$;

-- Phase 4: Create improved user creation function (RPC)
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
  
  -- Create invitation record (assumes user_invitations table exists)
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
    invitation_role,
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
$$;

-- Phase 5: Add user_invitations table if not exists
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL,
  department text,
  phone_number text,
  office_number text,
  floor text,
  invitation_token uuid NOT NULL UNIQUE,
  invited_by uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamp with time zone NOT NULL,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user_invitations
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_invitations
CREATE POLICY "Admins can manage invitations" ON public.user_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Phase 6: Add constraints to ensure data integrity
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_not_null CHECK (role IS NOT NULL),
  ADD CONSTRAINT profiles_approval_status_not_null CHECK (approval_status IS NOT NULL);

-- Phase 7: Create function to get comprehensive user stats
CREATE OR REPLACE FUNCTION public.get_user_management_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats jsonb;
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;
  
  SELECT jsonb_build_object(
    'total_users', COUNT(*),
    'verified_users', COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL),
    'pending_users', COUNT(*) FILTER (WHERE confirmed_at IS NULL),
    'approved_users', COUNT(*) FILTER (WHERE approval_status = 'approved'),
    'pending_approval', COUNT(*) FILTER (WHERE approval_status = 'pending'),
    'rejected_users', COUNT(*) FILTER (WHERE approval_status = 'rejected'),
    'admin_users', COUNT(*) FILTER (WHERE role = 'admin'),
    'staff_users', COUNT(*) FILTER (WHERE role IN ('ops_supervisor', 'field_staff')),
    'tenant_users', COUNT(*) FILTER (WHERE role = 'tenant_manager'),
    'vendor_users', COUNT(*) FILTER (WHERE role = 'vendor'),
    'users_without_profiles', (
      SELECT COUNT(*) FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      WHERE p.id IS NULL AND u.deleted_at IS NULL
    )
  ) INTO stats
  FROM (
    SELECT 
      p.*,
      u.confirmed_at
    FROM public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    WHERE u.deleted_at IS NULL
  ) user_data;
  
  RETURN stats;
END;
$$;