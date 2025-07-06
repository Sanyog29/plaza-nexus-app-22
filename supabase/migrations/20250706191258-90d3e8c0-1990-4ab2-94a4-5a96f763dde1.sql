-- Phase 1A: Remove all dependencies on role column first

-- Drop policies that depend on role column
DROP POLICY IF EXISTS "Supervisors can manage assets" ON public.assets;
DROP POLICY IF EXISTS "Supervisors can manage utility meters" ON public.utility_meters;
DROP POLICY IF EXISTS "Supervisors can manage utility readings" ON public.utility_readings;
DROP POLICY IF EXISTS "Supervisors can manage AMC alerts" ON public.amc_alerts;
DROP POLICY IF EXISTS "Supervisors can create assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Supervisors can manage assignments" ON public.task_assignments;

-- Drop any triggers that depend on role column
DROP TRIGGER IF EXISTS profile_role_change_audit ON public.profiles;

-- Now update the role system
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'ops_supervisor', 'field_staff', 'tenant_manager', 'vendor');

-- Update profiles table to use new role system
ALTER TABLE public.profiles 
ALTER COLUMN role DROP DEFAULT,
ALTER COLUMN role TYPE public.app_role USING 
  CASE 
    WHEN role = 'admin' THEN 'admin'::public.app_role
    WHEN role IN ('staff', 'ops_l2') THEN 'ops_supervisor'::public.app_role
    WHEN role = 'ops_l1' THEN 'field_staff'::public.app_role
    WHEN role = 'tenant' THEN 'tenant_manager'::public.app_role
    ELSE 'tenant_manager'::public.app_role
  END,
ALTER COLUMN role SET DEFAULT 'tenant_manager'::public.app_role;

DROP TYPE public.app_role_old;