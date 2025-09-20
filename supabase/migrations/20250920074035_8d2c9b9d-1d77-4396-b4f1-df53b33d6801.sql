-- Fix "Unknown User" issue by enhancing vendor staff RPCs with auth.users fallback

-- 1. Update admin_get_vendor_staff_assignments to use auth.users fallback
CREATE OR REPLACE FUNCTION public.admin_get_vendor_staff_assignments()
RETURNS TABLE(
  assignment_id uuid,
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  vendor_id uuid,
  vendor_name text,
  is_active boolean,
  assigned_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view vendor staff assignments';
  END IF;
  
  RETURN QUERY
  SELECT 
    vs.id as assignment_id,
    vs.user_id,
    COALESCE(
      NULLIF(p.first_name, ''), 
      NULLIF(u.raw_user_meta_data ->> 'first_name', ''),
      SPLIT_PART(SPLIT_PART(u.email, '@', 1), '.', 1)
    ) as first_name,
    COALESCE(
      NULLIF(p.last_name, ''), 
      NULLIF(u.raw_user_meta_data ->> 'last_name', ''),
      SPLIT_PART(SPLIT_PART(u.email, '@', 1), '.', 2)
    ) as last_name,
    COALESCE(p.email, u.email) as email,
    vs.vendor_id,
    v.name as vendor_name,
    vs.is_active,
    vs.created_at as assigned_at
  FROM public.vendor_staff vs
  LEFT JOIN public.profiles p ON vs.user_id = p.id
  LEFT JOIN auth.users u ON vs.user_id = u.id
  LEFT JOIN public.vendors v ON vs.vendor_id = v.id
  WHERE u.id IS NOT NULL  -- Only include assignments for existing users
  ORDER BY vs.created_at DESC;
END;
$$;

-- 2. Update admin_get_unassigned_users to use auth.users fallback
CREATE OR REPLACE FUNCTION public.admin_get_unassigned_users()
RETURNS TABLE(
  user_id uuid,
  first_name text,
  last_name text,
  email text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view unassigned users';
  END IF;
  
  RETURN QUERY
  SELECT 
    u.id as user_id,
    COALESCE(
      NULLIF(p.first_name, ''), 
      NULLIF(u.raw_user_meta_data ->> 'first_name', ''),
      SPLIT_PART(SPLIT_PART(u.email, '@', 1), '.', 1)
    ) as first_name,
    COALESCE(
      NULLIF(p.last_name, ''), 
      NULLIF(u.raw_user_meta_data ->> 'last_name', ''),
      SPLIT_PART(SPLIT_PART(u.email, '@', 1), '.', 2)
    ) as last_name,
    COALESCE(p.email, u.email) as email,
    COALESCE(p.role::text, 'tenant') as role
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.deleted_at IS NULL
    AND u.id NOT IN (
      SELECT vs.user_id 
      FROM public.vendor_staff vs 
      WHERE vs.is_active = true
    )
  ORDER BY u.created_at DESC;
END;
$$;

-- 3. Create function to backfill missing profiles from auth.users
CREATE OR REPLACE FUNCTION public.admin_backfill_profiles_from_auth()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  backfilled_count integer := 0;
  user_record record;
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can backfill profiles';
  END IF;
  
  -- Insert missing profiles from auth.users
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE u.deleted_at IS NULL AND p.id IS NULL
  LOOP
    INSERT INTO public.profiles (
      id,
      first_name,
      last_name,
      email,
      role,
      approval_status
    ) VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(user_record.raw_user_meta_data ->> 'last_name', ''),
      user_record.email,
      COALESCE((user_record.raw_user_meta_data ->> 'role')::app_role, 'tenant_manager'::app_role),
      'approved'::approval_status
    );
    
    backfilled_count := backfilled_count + 1;
  END LOOP;
  
  -- Update existing profiles with missing data
  UPDATE public.profiles 
  SET 
    first_name = COALESCE(
      NULLIF(profiles.first_name, ''),
      u.raw_user_meta_data ->> 'first_name',
      ''
    ),
    last_name = COALESCE(
      NULLIF(profiles.last_name, ''),
      u.raw_user_meta_data ->> 'last_name', 
      ''
    ),
    email = COALESCE(NULLIF(profiles.email, ''), u.email),
    updated_at = now()
  FROM auth.users u
  WHERE profiles.id = u.id
    AND u.deleted_at IS NULL
    AND (
      profiles.first_name IS NULL OR profiles.first_name = '' OR
      profiles.last_name IS NULL OR profiles.last_name = '' OR
      profiles.email IS NULL OR profiles.email = ''
    );
  
  RETURN jsonb_build_object(
    'success', true,
    'backfilled_count', backfilled_count,
    'message', 'Profile data synchronized successfully'
  );
END;
$$;

-- 4. Update cleanup function to only remove truly orphaned records
CREATE OR REPLACE FUNCTION public.admin_cleanup_orphaned_vendor_staff()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Check if caller is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can cleanup orphaned records';
  END IF;
  
  -- First backfill any missing profiles
  PERFORM public.admin_backfill_profiles_from_auth();
  
  -- Delete vendor_staff records where the user no longer exists in auth.users
  DELETE FROM public.vendor_staff 
  WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE deleted_at IS NULL
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'message', 'Cleanup completed successfully'
  );
END;
$$;