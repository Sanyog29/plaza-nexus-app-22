-- First, let's manually create missing profiles for orphaned users
INSERT INTO public.profiles (id, first_name, last_name, role, approval_status, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  'tenant_manager'::app_role as role,
  'pending'::approval_status as approval_status,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;

-- Create the repair function that was missing
CREATE OR REPLACE FUNCTION public.repair_orphaned_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  repaired_count INTEGER := 0;
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, approval_status, created_at, updated_at)
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
    'tenant_manager'::app_role as role,
    'pending'::approval_status as approval_status,
    au.created_at,
    NOW() as updated_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
    AND au.deleted_at IS NULL
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS repaired_count = ROW_COUNT;
  RETURN repaired_count;
END;
$$;

-- Create the system health function
CREATE OR REPLACE FUNCTION public.get_system_health_info()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  health_data JSONB;
  orphaned_count INTEGER;
  total_users INTEGER;
  pending_users INTEGER;
BEGIN
  -- Count orphaned users (in auth.users but not in profiles)
  SELECT COUNT(*) INTO orphaned_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL AND au.deleted_at IS NULL;
  
  -- Count total users
  SELECT COUNT(*) INTO total_users
  FROM auth.users
  WHERE deleted_at IS NULL;
  
  -- Count pending users
  SELECT COUNT(*) INTO pending_users
  FROM public.profiles
  WHERE approval_status = 'pending';
  
  health_data := jsonb_build_object(
    'orphaned_users', orphaned_count,
    'total_users', total_users,
    'pending_users', pending_users,
    'health_status', CASE 
      WHEN orphaned_count > 0 THEN 'warning'
      ELSE 'healthy'
    END,
    'last_checked', NOW()
  );
  
  RETURN health_data;
END;
$$;