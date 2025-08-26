-- Migration Part 2: Data migration and function updates
-- Now that enum values are committed, we can use them

-- Migrate existing role data
UPDATE public.profiles SET role = 'tenant' WHERE role = 'tenant_manager';
UPDATE public.profiles SET role = 'mst' WHERE role = 'field_staff';
UPDATE public.profiles SET role = 'assistant_manager' WHERE role = 'ops_supervisor';

-- Update user_invitations table as well
UPDATE public.user_invitations SET role = 'tenant' WHERE role = 'tenant_manager';
UPDATE public.user_invitations SET role = 'mst' WHERE role = 'field_staff';
UPDATE public.user_invitations SET role = 'assistant_manager' WHERE role = 'ops_supervisor';

-- Update default role to 'tenant'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'tenant'::app_role;

-- Create helper functions for internal role level management
CREATE OR REPLACE FUNCTION public.role_level(user_role app_role)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE user_role
    WHEN 'mst' THEN 'L1'
    WHEN 'fe' THEN 'L1'
    WHEN 'hk' THEN 'L1'
    WHEN 'se' THEN 'L1'
    WHEN 'assistant_manager' THEN 'L2'
    WHEN 'assistant_floor_manager' THEN 'L2'
    WHEN 'assistant_general_manager' THEN 'L3'
    WHEN 'assistant_vice_president' THEN 'L3'
    WHEN 'vp' THEN 'L4'
    WHEN 'ceo' THEN 'L4'
    WHEN 'cxo' THEN 'L4'
    ELSE 'other'
  END;
$$;

-- Helper functions for role level checks
CREATE OR REPLACE FUNCTION public.is_l1(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('mst', 'fe', 'hk', 'se')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_l2(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('assistant_manager', 'assistant_floor_manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_l3(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('assistant_general_manager', 'assistant_vice_president')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_l4(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('vp', 'ceo', 'cxo')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_management(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT is_l2($1) OR is_l3($1) OR is_l4($1);
$$;