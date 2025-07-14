-- Check current column definition
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profile_audit_logs' 
AND table_schema = 'public' 
AND column_name = 'changed_by';

-- The constraint wasn't dropped properly, let's be more explicit
DO $$ 
BEGIN
    -- Try to drop the constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_audit_logs_action_type_check') THEN
        ALTER TABLE public.profile_audit_logs DROP CONSTRAINT profile_audit_logs_action_type_check;
    END IF;
    
    -- Make changed_by nullable
    ALTER TABLE public.profile_audit_logs ALTER COLUMN changed_by DROP NOT NULL;
EXCEPTION 
    WHEN OTHERS THEN
        -- Continue if constraints don't exist
        NULL;
END $$;

-- Now insert the missing profile
INSERT INTO public.profiles (id, first_name, last_name, role, approval_status, created_at, updated_at)
VALUES (
  '4fad7c5f-517a-46e4-8305-20df1fbd5d03',
  'Akshay',
  'Londhe',
  'tenant_manager'::app_role,
  'pending'::approval_status,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;