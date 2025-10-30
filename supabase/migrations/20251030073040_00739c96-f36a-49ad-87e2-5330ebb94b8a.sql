-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON UNPROTECTED TABLES
-- =====================================================

ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_in_organization(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.user_id = _user_id
      AND ou.organization_id = _org_id
      AND ou.is_active = true
      AND ou.status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_site_access(_user_id uuid, _site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.site_access sa
    JOIN public.organization_users ou ON ou.id = sa.organization_user_id
    WHERE ou.user_id = _user_id
      AND sa.site_id = _site_id
      AND ou.is_active = true
      AND ou.status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id uuid)
RETURNS TABLE(organization_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT organization_id
  FROM public.organization_users
  WHERE user_id = _user_id
    AND is_active = true
    AND status = 'approved';
$$;

-- =====================================================
-- ORGANIZATIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "users_view_own_organizations" ON public.organizations
FOR SELECT
USING (
  id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
);

CREATE POLICY "admins_view_all_organizations" ON public.organizations
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "admins_manage_organizations" ON public.organizations
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- SITES TABLE POLICIES
-- =====================================================

CREATE POLICY "users_view_org_sites" ON public.sites
FOR SELECT
USING (
  organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
);

CREATE POLICY "admins_view_all_sites" ON public.sites
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "staff_manage_sites" ON public.sites
FOR ALL
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

-- =====================================================
-- ORGANIZATION_USERS TABLE POLICIES
-- =====================================================

CREATE POLICY "users_view_own_memberships" ON public.organization_users
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "users_view_org_members" ON public.organization_users
FOR SELECT
USING (
  organization_id IN (SELECT organization_id FROM public.get_user_organizations(auth.uid()))
  AND status = 'approved'
  AND is_active = true
);

CREATE POLICY "admins_view_all_org_users" ON public.organization_users
FOR SELECT
USING (public.is_admin(auth.uid()));

CREATE POLICY "admins_manage_org_users" ON public.organization_users
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- =====================================================
-- SITE_ACCESS TABLE POLICIES
-- =====================================================

CREATE POLICY "staff_view_site_access" ON public.site_access
FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "admins_manage_site_access" ON public.site_access
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "staff_insert_site_access" ON public.site_access
FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff_update_site_access" ON public.site_access
FOR UPDATE
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "staff_delete_site_access" ON public.site_access
FOR DELETE
USING (public.is_staff(auth.uid()));

-- =====================================================
-- METERS TABLE POLICIES
-- =====================================================

CREATE POLICY "users_view_accessible_meters" ON public.meters
FOR SELECT
USING (
  public.user_has_site_access(auth.uid(), site_id)
  OR public.is_staff(auth.uid())
);

CREATE POLICY "staff_view_all_meters" ON public.meters
FOR SELECT
USING (public.is_staff(auth.uid()));

CREATE POLICY "staff_manage_meters" ON public.meters
FOR ALL
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));