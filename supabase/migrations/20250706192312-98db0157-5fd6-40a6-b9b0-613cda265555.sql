-- Phase 1A: Alternative approach - add new column, migrate data, then replace
-- Create new role enum
CREATE TYPE public.user_role_new AS ENUM ('admin', 'ops_supervisor', 'field_staff', 'tenant_manager', 'vendor');

-- Add new role column
ALTER TABLE public.profiles ADD COLUMN role_new public.user_role_new;

-- Migrate existing role data to new column
UPDATE public.profiles SET role_new = 
  CASE 
    WHEN role = 'admin' THEN 'admin'::public.user_role_new
    WHEN role IN ('staff', 'ops_l2') THEN 'ops_supervisor'::public.user_role_new
    WHEN role = 'ops_l1' THEN 'field_staff'::public.user_role_new
    WHEN role = 'tenant' THEN 'tenant_manager'::public.user_role_new
    ELSE 'tenant_manager'::public.user_role_new
  END;

-- Set default for new column
ALTER TABLE public.profiles ALTER COLUMN role_new SET DEFAULT 'tenant_manager'::public.user_role_new;

-- Make new column not null
ALTER TABLE public.profiles ALTER COLUMN role_new SET NOT NULL;

-- Drop the old role column (this will automatically drop dependent policies and triggers)
ALTER TABLE public.profiles DROP COLUMN role;

-- Rename new column to role
ALTER TABLE public.profiles RENAME COLUMN role_new TO role;

-- Drop old enum and rename new one
DROP TYPE public.app_role;
ALTER TYPE public.user_role_new RENAME TO app_role;