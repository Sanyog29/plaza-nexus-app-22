-- Drop the problematic check constraint
ALTER TABLE public.profile_audit_logs DROP CONSTRAINT IF EXISTS profile_audit_logs_action_type_check;

-- Now insert the missing profile
INSERT INTO public.profiles (id, first_name, last_name, role, approval_status, created_at, updated_at)
SELECT 
  '4fad7c5f-517a-46e4-8305-20df1fbd5d03',
  'Akshay',
  'Londhe',
  'tenant_manager'::app_role,
  'pending'::approval_status,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '4fad7c5f-517a-46e4-8305-20df1fbd5d03');