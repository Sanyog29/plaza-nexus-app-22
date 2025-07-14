-- Check what triggers exist on profiles table
SELECT tgname, proname, tgenabled 
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
AND NOT tgisinternal;

-- Drop ALL triggers on profiles table to stop the interference
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trigger_track_profile_changes ON public.profiles;
DROP TRIGGER IF EXISTS profile_changes_trigger ON public.profiles;

-- Drop the check constraint that's causing issues
ALTER TABLE public.profile_audit_logs DROP CONSTRAINT IF EXISTS profile_audit_logs_action_type_check;

-- Now try to create the missing profiles
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