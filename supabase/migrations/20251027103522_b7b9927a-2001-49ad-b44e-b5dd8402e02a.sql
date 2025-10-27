-- Fix admin and super_admin role checks throughout the system
-- This migration ensures both 'admin' and 'super_admin' roles have appropriate access

-- 1. Update is_admin_secure() to check for both admin and super_admin
DROP FUNCTION IF EXISTS public.is_admin_secure(uuid);

CREATE OR REPLACE FUNCTION public.is_admin_secure(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT public.has_role(user_id, 'admin') OR public.has_role(user_id, 'super_admin');
$$;

-- 2. Create is_super_admin() helper function for super-admin-only checks
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT public.has_role(user_id, 'super_admin');
$$;

-- 3. Update RLS policies on user_roles table to include both admin and super_admin
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins and users can view roles" ON public.user_roles;

CREATE POLICY "Admins and super_admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Admins and super_admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Admins and super_admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Admins, super_admins, and users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin')
);

-- 4. Update RLS policy on user_approval_audit table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'user_approval_audit'
  ) THEN
    DROP POLICY IF EXISTS "Only admins can view approval audit" ON public.user_approval_audit;
    
    CREATE POLICY "Admins and super_admins can view approval audit"
    ON public.user_approval_audit
    FOR SELECT
    TO authenticated
    USING (
      public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')
    );
  END IF;
END $$;

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_admin_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- 6. Add comment for documentation
COMMENT ON FUNCTION public.is_admin_secure(uuid) IS 
'Returns true if the user has either admin or super_admin role. Super admins have cross-property access, while regular admins are property-scoped.';

COMMENT ON FUNCTION public.is_super_admin(uuid) IS 
'Returns true if the user has super_admin role. Super admins have unrestricted cross-property access.';