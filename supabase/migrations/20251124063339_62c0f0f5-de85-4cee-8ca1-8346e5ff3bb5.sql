-- Fix orphaned users and strengthen profile creation

-- Step 1: Fix current orphaned user by creating missing profile
INSERT INTO public.profiles (
  id, 
  first_name, 
  last_name,
  email,
  assigned_role_title,
  department,
  specialization,
  approval_status,
  created_at,
  updated_at
)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'mst') as assigned_role_title,
  COALESCE(au.raw_user_meta_data->>'department', '') as department,
  COALESCE(au.raw_user_meta_data->>'specialization', '') as specialization,
  'pending'::approval_status as approval_status,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = au.id)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create repair function for future orphaned users
CREATE OR REPLACE FUNCTION public.repair_orphaned_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  repaired_count INTEGER := 0;
  unassigned_property_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Insert missing profiles for orphaned users
  INSERT INTO public.profiles (
    id, 
    first_name, 
    last_name,
    email,
    assigned_role_title,
    department,
    specialization,
    approval_status,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
    au.email,
    COALESCE(au.raw_user_meta_data->>'role', 'mst') as assigned_role_title,
    COALESCE(au.raw_user_meta_data->>'department', '') as department,
    COALESCE(au.raw_user_meta_data->>'specialization', '') as specialization,
    'pending'::approval_status as approval_status,
    au.created_at,
    NOW() as updated_at
  FROM auth.users au
  WHERE au.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = au.id)
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS repaired_count = ROW_COUNT;
  
  -- Assign orphaned users to "Unassigned" property if they have no property
  INSERT INTO public.property_assignments (user_id, property_id, is_primary, assigned_by)
  SELECT 
    p.id,
    unassigned_property_id,
    true,
    NULL
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.property_assignments pa 
    WHERE pa.user_id = p.id
  )
  ON CONFLICT (user_id, property_id) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'repaired_profiles', repaired_count,
    'message', format('%s orphaned user(s) repaired', repaired_count)
  );
END;
$function$;

-- Step 3: Create system health monitoring function
CREATE OR REPLACE FUNCTION public.get_system_health_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  orphaned_users_count INTEGER;
  users_without_property_count INTEGER;
  pending_users_count INTEGER;
BEGIN
  -- Count orphaned users (in auth.users but not in profiles)
  SELECT COUNT(*) INTO orphaned_users_count
  FROM auth.users au
  WHERE au.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = au.id);
  
  -- Count users without property assignments
  SELECT COUNT(*) INTO users_without_property_count
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.property_assignments pa 
    WHERE pa.user_id = p.id
  );
  
  -- Count pending approvals
  SELECT COUNT(*) INTO pending_users_count
  FROM public.profiles
  WHERE approval_status = 'pending';
  
  RETURN jsonb_build_object(
    'orphaned_users', orphaned_users_count,
    'users_without_property', users_without_property_count,
    'pending_approvals', pending_users_count,
    'has_issues', (orphaned_users_count > 0 OR users_without_property_count > 0),
    'checked_at', NOW()
  );
END;
$function$;

-- Step 4: Strengthen handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  unassigned_property_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Create profile entry
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    email,
    phone_number,
    assigned_role_title,
    department,
    specialization,
    approval_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'role', 'mst'),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'specialization', ''),
    'pending'::approval_status,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  -- Ensure user has property assignment (default to Unassigned if not specified)
  INSERT INTO public.property_assignments (user_id, property_id, is_primary, assigned_by)
  SELECT 
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'property_id')::uuid,
      unassigned_property_id
    ),
    true,
    NULL
  WHERE NOT EXISTS (
    SELECT 1 FROM public.property_assignments 
    WHERE user_id = NEW.id
  )
  ON CONFLICT (user_id, property_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user creation
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$function$;