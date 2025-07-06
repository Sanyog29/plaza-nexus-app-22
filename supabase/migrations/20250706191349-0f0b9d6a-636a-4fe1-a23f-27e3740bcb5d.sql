-- Phase 1A: Drop ALL policies that reference role column
DROP POLICY IF EXISTS "Supervisors can manage service records" ON public.service_records;
DROP POLICY IF EXISTS "Supervisors can create service records" ON public.service_records;
DROP POLICY IF EXISTS "Only ops staff can create simple tasks" ON public.simple_tasks;
DROP POLICY IF EXISTS "Ops staff can manage simple tasks" ON public.simple_tasks;

-- Check if there are any other policies and drop them
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE definition LIKE '%role%' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

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