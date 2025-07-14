-- Make changed_by nullable in profile_audit_logs to handle system operations
ALTER TABLE public.profile_audit_logs 
ALTER COLUMN changed_by DROP NOT NULL;

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