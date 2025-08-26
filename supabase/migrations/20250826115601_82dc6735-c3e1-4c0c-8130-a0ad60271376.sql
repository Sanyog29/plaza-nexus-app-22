-- Phase 1: Extend app_role enum with new roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'mst';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'fe';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'hk';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'se';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'assistant_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'assistant_floor_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'assistant_general_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'assistant_vice_president';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'vp';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ceo';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'cxo';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'tenant';

-- Phase 2: Migrate existing role data
UPDATE public.profiles SET role = 'tenant' WHERE role = 'tenant_manager';
UPDATE public.profiles SET role = 'mst' WHERE role = 'field_staff';
UPDATE public.profiles SET role = 'assistant_manager' WHERE role = 'ops_supervisor';

-- Update user_invitations table as well
UPDATE public.user_invitations SET role = 'tenant' WHERE role = 'tenant_manager';
UPDATE public.user_invitations SET role = 'mst' WHERE role = 'field_staff';
UPDATE public.user_invitations SET role = 'assistant_manager' WHERE role = 'ops_supervisor';

-- Phase 3: Update default role to 'tenant'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'tenant'::app_role;

-- Phase 4: Create helper functions for internal role level management
CREATE OR REPLACE FUNCTION public.role_level(user_role app_role)
RETURNS text
LANGUAGE sql
STABLE
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
AS $$
  SELECT is_l2($1) OR is_l3($1) OR is_l4($1);
$$;

-- Phase 5: Update existing functions to work with new roles
CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('admin', 'mst', 'fe', 'hk', 'se', 'assistant_manager', 'assistant_floor_manager', 'assistant_general_manager', 'assistant_vice_president')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ops_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('mst', 'fe', 'hk', 'se', 'assistant_manager', 'assistant_floor_manager', 'admin')
  );
$$;

-- Update get_user_permissions function for new roles
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    permissions JSONB;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = user_id;
    
    permissions := CASE user_role
        WHEN 'admin' THEN jsonb_build_object(
            'can_manage_users', true,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', true,
            'can_view_analytics', true,
            'can_manage_vendors', true,
            'can_manage_system_settings', true,
            'can_approve_requests', true,
            'can_delete_users', true
        )
        -- L2 Management roles
        WHEN 'assistant_manager' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false,
            'can_approve_requests', true,
            'can_manage_staff_zones', true
        )
        WHEN 'assistant_floor_manager' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false,
            'can_approve_requests', true,
            'can_manage_staff_zones', true
        )
        -- L3 Senior Management roles
        WHEN 'assistant_general_manager' THEN jsonb_build_object(
            'can_manage_users', true,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', true,
            'can_view_analytics', true,
            'can_manage_vendors', true,
            'can_approve_requests', true,
            'can_manage_staff_zones', true
        )
        WHEN 'assistant_vice_president' THEN jsonb_build_object(
            'can_manage_users', true,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', true,
            'can_view_analytics', true,
            'can_manage_vendors', true,
            'can_approve_requests', true,
            'can_manage_staff_zones', true
        )
        -- L4 Executive roles (high-level read/approval)
        WHEN 'vp' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false,
            'can_approve_requests', true
        )
        WHEN 'ceo' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false,
            'can_approve_requests', true
        )
        WHEN 'cxo' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false,
            'can_approve_requests', true
        )
        -- L1 Operational staff
        WHEN 'mst' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_work_on_requests', true,
            'can_acknowledge_tickets', true,
            'can_upload_attachments', true
        )
        WHEN 'fe' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_work_on_requests', true,
            'can_acknowledge_tickets', true,
            'can_upload_attachments', true
        )
        WHEN 'hk' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_work_on_requests', true,
            'can_acknowledge_tickets', true,
            'can_upload_attachments', true
        )
        WHEN 'se' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_work_on_requests', true,
            'can_acknowledge_tickets', true,
            'can_upload_attachments', true,
            'can_manage_security', true
        )
        -- Tenant role (formerly tenant_manager)
        WHEN 'tenant' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_raise_requests', true,
            'can_view_own_requests', true
        )
        -- Vendor role (unchanged)
        WHEN 'vendor' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false,
            'can_view_vendor_orders', true,
            'can_manage_vendor_menu', true
        )
        ELSE jsonb_build_object()
    END;
    
    RETURN permissions;
END;
$$;