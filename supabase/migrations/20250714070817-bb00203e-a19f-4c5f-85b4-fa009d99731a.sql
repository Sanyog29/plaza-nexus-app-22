-- Fix the profile audit trigger to handle system operations
CREATE OR REPLACE FUNCTION public.track_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only track if there are actual changes
  IF (TG_OP = 'UPDATE' AND NEW IS DISTINCT FROM OLD) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.profile_audit_logs (
      profile_id,
      changed_by,
      changes,
      action_type
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid), -- Use system UUID for system operations
      CASE 
        WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
          'old', to_jsonb(OLD),
          'new', to_jsonb(NEW)
        )
        ELSE to_jsonb(OLD)
      END,
      LOWER(TG_OP)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Now create missing profiles for users who don't have them
INSERT INTO public.profiles (id, first_name, last_name, role, approval_status)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(u.raw_user_meta_data->>'last_name', '') as last_name,
  'tenant_manager'::app_role as role,
  'pending'::approval_status as approval_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
  AND u.deleted_at IS NULL;

-- Create a more robust handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  BEGIN
    -- Insert profile with data from user metadata
    INSERT INTO public.profiles (
      id, 
      first_name, 
      last_name, 
      role, 
      approval_status
    )
    VALUES (
      new.id, 
      COALESCE(new.raw_user_meta_data->>'first_name', ''),
      COALESCE(new.raw_user_meta_data->>'last_name', ''),
      'tenant_manager'::app_role, 
      'pending'::approval_status
    );
    
    -- Log successful profile creation
    RAISE LOG 'Successfully created profile for user %', new.id;
    
    RETURN new;
  EXCEPTION
    WHEN others THEN
      -- Log the detailed error
      RAISE LOG 'Error creating profile for user %: % (SQLSTATE: %)', 
        new.id, SQLERRM, SQLSTATE;
      
      -- Try to insert a minimal profile as fallback
      BEGIN
        INSERT INTO public.profiles (id, first_name, last_name, role, approval_status)
        VALUES (new.id, '', '', 'tenant_manager'::app_role, 'pending'::approval_status)
        ON CONFLICT (id) DO NOTHING;
        
        RAISE LOG 'Created fallback profile for user %', new.id;
      EXCEPTION
        WHEN others THEN
          RAISE LOG 'Failed to create fallback profile for user %: %', new.id, SQLERRM;
      END;
      
      -- Don't block user creation even if profile creation fails
      RETURN new;
  END;
END;
$function$;

-- Update the get_user_management_data function to show all users, even without profiles
CREATE OR REPLACE FUNCTION public.get_user_management_data(caller_id uuid)
RETURNS TABLE(
  id uuid, 
  first_name text, 
  last_name text, 
  role text, 
  approval_status text, 
  approved_by uuid, 
  approved_at timestamp with time zone, 
  rejection_reason text, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  email text, 
  confirmed_at timestamp with time zone, 
  last_sign_in_at timestamp with time zone,
  has_profile boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.is_admin(caller_id) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view user management data';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    COALESCE(p.first_name, '')::text as first_name,
    COALESCE(p.last_name, '')::text as last_name,
    COALESCE(p.role::text, 'tenant_manager') as role,
    COALESCE(p.approval_status::text, 'pending') as approval_status,
    p.approved_by,
    p.approved_at,
    p.rejection_reason,
    COALESCE(p.created_at, u.created_at) as created_at,
    COALESCE(p.updated_at, u.updated_at) as updated_at,
    COALESCE(u.email, '')::text as email,
    u.confirmed_at,
    u.last_sign_in_at,
    (p.id IS NOT NULL) as has_profile
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.deleted_at IS NULL
  ORDER BY COALESCE(p.created_at, u.created_at) DESC;
END;
$function$;

-- Create a function to repair orphaned users (users without profiles)
CREATE OR REPLACE FUNCTION public.repair_orphaned_users()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  repaired_count integer := 0;
  user_record record;
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
        COALESCE(user_record.raw_user_meta_data->>'first_name', ''),
        COALESCE(user_record.raw_user_meta_data->>'last_name', ''),
        'tenant_manager'::app_role,
        'pending'::approval_status,
        user_record.created_at,
        now()
      );
      
      repaired_count := repaired_count + 1;
      
      RAISE LOG 'Repaired orphaned user: % (email: %)', 
        user_record.id, user_record.email;
        
    EXCEPTION
      WHEN others THEN
        RAISE LOG 'Failed to repair user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;

  RETURN repaired_count;
END;
$function$;

-- Create a function to get system health information
CREATE OR REPLACE FUNCTION public.get_system_health_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  health_info jsonb;
  orphaned_users_count integer;
  total_users_count integer;
  pending_approvals_count integer;
BEGIN
  -- Only allow staff to view system health
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Only staff can view system health information';
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
    'last_checked', now()
  );

  RETURN health_info;
END;
$function$;