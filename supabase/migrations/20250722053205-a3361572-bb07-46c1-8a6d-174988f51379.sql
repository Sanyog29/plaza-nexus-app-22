
-- Fix orphaned user profile issue and implement security hardening
-- 1. First, let's repair any existing orphaned users
SELECT public.repair_orphaned_users();

-- 2. Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert profile with better error handling and validation
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name, 
    role, 
    approval_status,
    department,
    phone_number,
    office_number,
    floor,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), ''),
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'tenant_manager'::app_role),
    'pending'::approval_status,
    NULLIF(trim(NEW.raw_user_meta_data ->> 'department'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'phone_number'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'office_number'), ''),
    NULLIF(trim(NEW.raw_user_meta_data ->> 'floor'), ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'first_name'), ''), profiles.first_name),
    last_name = COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'last_name'), ''), profiles.last_name),
    department = COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'department'), ''), profiles.department),
    phone_number = COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'phone_number'), ''), profiles.phone_number),
    office_number = COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'office_number'), ''), profiles.office_number),
    floor = COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'floor'), ''), profiles.floor),
    updated_at = NOW();
    
  -- Log successful profile creation
  RAISE LOG 'Profile created/updated for user: % (email: %)', NEW.id, NEW.email;
    
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log detailed error but don't block user creation
    RAISE LOG 'Error in handle_new_user for user % (email: %): % - %', 
      NEW.id, NEW.email, SQLSTATE, SQLERRM;
    
    -- Try a minimal profile creation as fallback
    BEGIN
      INSERT INTO public.profiles (id, role, approval_status, created_at, updated_at)
      VALUES (NEW.id, 'tenant_manager'::app_role, 'pending'::approval_status, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
      
      RAISE LOG 'Fallback profile created for user: %', NEW.id;
    EXCEPTION
      WHEN others THEN
        RAISE LOG 'Fallback profile creation also failed for user %: %', NEW.id, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

-- 3. Update system health function to be more secure
CREATE OR REPLACE FUNCTION public.get_system_health_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  health_info jsonb;
  orphaned_users_count integer;
  total_users_count integer;
  pending_approvals_count integer;
BEGIN
  -- Only allow admins to view system health
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view system health information';
  END IF;

  -- Count orphaned users (users without profiles)
  SELECT COUNT(*) INTO orphaned_users_count
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL AND u.deleted_at IS NULL;

  -- Count total users
  SELECT COUNT(*) INTO total_users_count
  FROM auth.users u
  WHERE u.deleted_at IS NULL;

  -- Count pending approvals
  SELECT COUNT(*) INTO pending_approvals_count
  FROM public.profiles
  WHERE approval_status = 'pending';

  -- Build health info object
  health_info := jsonb_build_object(
    'total_users', total_users_count,
    'orphaned_users', orphaned_users_count,
    'pending_approvals', pending_approvals_count,
    'profile_integrity', CASE 
      WHEN orphaned_users_count = 0 THEN 'healthy'
      WHEN orphaned_users_count <= 2 THEN 'warning'
      ELSE 'critical'
    END,
    'last_checked', NOW()
  );

  RETURN health_info;
END;
$$;

-- 4. Add missing RLS policy for user_invitations table
CREATE POLICY "Admins can manage user invitations"
ON public.user_invitations
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 5. Add RLS policy for notifications table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
    -- Enable RLS on notifications if not already enabled
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    
    -- Create policies for notifications
    CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
    
    CREATE POLICY "System can create notifications"
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
    
    CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- 6. Update repair function to be more robust
CREATE OR REPLACE FUNCTION public.repair_orphaned_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  repaired_count integer := 0;
  failed_count integer := 0;
  user_record record;
  result jsonb;
BEGIN
  -- Only allow admins to run this repair function
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can repair orphaned users';
  END IF;

  -- Find users without profiles and create them
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL 
      AND u.deleted_at IS NULL
  LOOP
    BEGIN
      INSERT INTO public.profiles (
        id, 
        first_name, 
        last_name, 
        role, 
        approval_status,
        created_at,
        updated_at
      )
      VALUES (
        user_record.id,
        COALESCE(NULLIF(trim(user_record.raw_user_meta_data->>'first_name'), ''), ''),
        COALESCE(NULLIF(trim(user_record.raw_user_meta_data->>'last_name'), ''), ''),
        'tenant_manager'::app_role,
        'pending'::approval_status,
        user_record.created_at,
        NOW()
      );
      
      repaired_count := repaired_count + 1;
      
      RAISE LOG 'Repaired orphaned user: % (email: %)', 
        user_record.id, user_record.email;
        
    EXCEPTION
      WHEN others THEN
        failed_count := failed_count + 1;
        RAISE LOG 'Failed to repair user % (email: %): %', 
          user_record.id, user_record.email, SQLERRM;
    END;
  END LOOP;

  result := jsonb_build_object(
    'success', true,
    'repaired_count', repaired_count,
    'failed_count', failed_count,
    'timestamp', NOW()
  );

  RETURN result;
END;
$$;

-- 7. Add index for better performance on user lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_approval_status 
ON public.profiles(approval_status) 
WHERE approval_status = 'pending';

-- 8. Add constraint to ensure profile integrity
ALTER TABLE public.profiles 
ADD CONSTRAINT check_profile_has_role 
CHECK (role IS NOT NULL);
