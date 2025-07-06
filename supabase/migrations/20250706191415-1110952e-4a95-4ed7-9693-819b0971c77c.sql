-- Phase 1A: Carefully drop only existing policies
DO $$ 
DECLARE 
    pol RECORD;
    table_exists BOOLEAN;
BEGIN
    -- Check and drop policies that reference role column for existing tables
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE definition LIKE '%role%' 
        AND schemaname = 'public'
    LOOP
        -- Check if table exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = pol.schemaname 
            AND table_name = pol.tablename
        ) INTO table_exists;
        
        IF table_exists THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
        END IF;
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