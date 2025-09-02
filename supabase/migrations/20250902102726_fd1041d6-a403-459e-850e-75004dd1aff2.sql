-- Add mobile number field to profiles and make email nullable for mobile-only users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create unique index on mobile_number where it's not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_mobile_number 
ON public.profiles (mobile_number) 
WHERE mobile_number IS NOT NULL;

-- Update user_invitations table to support mobile and password
ALTER TABLE public.user_invitations
ADD COLUMN IF NOT EXISTS mobile_number TEXT,
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS emp_id TEXT;

-- Create bulk_user_uploads table for tracking Excel uploads
CREATE TABLE IF NOT EXISTS public.bulk_user_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_by UUID NOT NULL,
  filename TEXT NOT NULL,
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  upload_status TEXT NOT NULL DEFAULT 'processing',
  error_summary JSONB DEFAULT '[]'::jsonb,
  success_summary JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);

-- Enable RLS on bulk_user_uploads
ALTER TABLE public.bulk_user_uploads ENABLE ROW LEVEL SECURITY;

-- Create policy for bulk uploads (admins only)
CREATE POLICY "Admins can manage bulk uploads" ON public.bulk_user_uploads
FOR ALL USING (is_admin(auth.uid()));

-- Update handle_new_user function to support mobile auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert profile with mobile number support
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
    floor,
    mobile_number
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
    NEW.raw_user_meta_data ->> 'floor',
    NEW.raw_user_meta_data ->> 'mobile_number'
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    department = COALESCE(EXCLUDED.department, profiles.department),
    specialization = COALESCE(EXCLUDED.specialization, profiles.specialization),
    mobile_number = COALESCE(EXCLUDED.mobile_number, profiles.mobile_number),
    updated_at = now();
    
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't block user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create function to check if role requires department
CREATE OR REPLACE FUNCTION public.role_requires_department(user_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT user_role != 'tenant_manager'::app_role;
$$;

-- Create RPC for bulk user creation
CREATE OR REPLACE FUNCTION public.admin_bulk_create_users(
  users_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record JSONB;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
  success_results JSONB := '[]'::jsonb;
  error_results JSONB := '[]'::jsonb;
  result JSONB;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only administrators can bulk create users');
  END IF;
  
  -- Process each user in the data array
  FOR user_record IN SELECT * FROM jsonb_array_elements(users_data)
  LOOP
    BEGIN
      -- Validate required fields
      IF (user_record ->> 'email' IS NULL OR user_record ->> 'email' = '') AND 
         (user_record ->> 'mobile_number' IS NULL OR user_record ->> 'mobile_number' = '') THEN
        error_results := error_results || jsonb_build_object(
          'emp_id', user_record ->> 'emp_id',
          'error', 'Either email or mobile number is required'
        );
        error_count := error_count + 1;
        CONTINUE;
      END IF;
      
      -- Create user invitation
      INSERT INTO public.user_invitations (
        email,
        mobile_number,
        first_name,
        last_name,
        role,
        department,
        specialization,
        password,
        emp_id,
        status
      ) VALUES (
        NULLIF(user_record ->> 'email', ''),
        NULLIF(user_record ->> 'mobile_number', ''),
        user_record ->> 'first_name',
        user_record ->> 'last_name',
        user_record ->> 'role',
        CASE 
          WHEN user_record ->> 'role' = 'tenant_manager' THEN NULL
          ELSE user_record ->> 'department'
        END,
        user_record ->> 'specialization',
        user_record ->> 'password',
        user_record ->> 'emp_id',
        'pending'
      );
      
      success_results := success_results || jsonb_build_object(
        'emp_id', user_record ->> 'emp_id',
        'email', user_record ->> 'email',
        'mobile_number', user_record ->> 'mobile_number',
        'name', CONCAT(user_record ->> 'first_name', ' ', user_record ->> 'last_name')
      );
      success_count := success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_results := error_results || jsonb_build_object(
        'emp_id', user_record ->> 'emp_id',
        'error', SQLERRM
      );
      error_count := error_count + 1;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success_count', success_count,
    'error_count', error_count,
    'success_results', success_results,
    'error_results', error_results
  );
END;
$$;