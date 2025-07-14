-- Drop the existing trigger completely
DROP TRIGGER IF EXISTS trigger_track_profile_changes ON public.profiles;

-- Make changed_by nullable to fix the constraint issue
ALTER TABLE public.profile_audit_logs ALTER COLUMN changed_by DROP NOT NULL;

-- Create missing profiles for orphaned users
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

-- Create the repair function
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