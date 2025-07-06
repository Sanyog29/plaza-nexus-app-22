-- Phase 1A: Comprehensive policy cleanup
-- Drop all policies that might reference role column

DROP POLICY IF EXISTS "Supervisors can manage service records" ON public.service_records;
DROP POLICY IF EXISTS "Supervisors can create service records" ON public.service_records;

-- Additional policies that might exist
DROP POLICY IF EXISTS "Staff can create service records" ON public.service_records;
DROP POLICY IF EXISTS "L2 staff can manage records" ON public.service_records;
DROP POLICY IF EXISTS "Ops L2 can manage assets" ON public.assets;
DROP POLICY IF EXISTS "Ops supervisors can manage" ON public.assets;

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