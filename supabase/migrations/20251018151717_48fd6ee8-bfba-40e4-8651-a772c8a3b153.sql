-- Fix Critical Security Issues: RLS Policies and Data Protection

-- 1. DROP SECURITY DEFINER VIEWS (bypasses RLS)
DROP VIEW IF EXISTS public.profiles_with_decrypted_data CASCADE;

-- 2. REMOVE PASSWORD_HASH COLUMN (exposed through RLS)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash CASCADE;

-- 3. ADD MISSING RLS POLICIES FOR EXISTING TABLES ONLY

-- certifications_master
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'certifications_master') THEN
    DROP POLICY IF EXISTS "Staff can view certifications master" ON public.certifications_master;
    DROP POLICY IF EXISTS "Admins can manage certifications master" ON public.certifications_master;
    CREATE POLICY "Staff can view certifications master" ON public.certifications_master FOR SELECT USING (is_staff(auth.uid()));
    CREATE POLICY "Admins can manage certifications master" ON public.certifications_master FOR ALL USING (is_admin(auth.uid()));
  END IF;
END $$;

-- dietary_preferences
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dietary_preferences') THEN
    DROP POLICY IF EXISTS "Users can manage their own dietary preferences" ON public.dietary_preferences;
    DROP POLICY IF EXISTS "Staff can view all dietary preferences" ON public.dietary_preferences;
    CREATE POLICY "Users can manage their own dietary preferences" ON public.dietary_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Staff can view all dietary preferences" ON public.dietary_preferences FOR SELECT USING (is_staff(auth.uid()));
  END IF;
END $$;

-- escalation_logs
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'escalation_logs') THEN
    DROP POLICY IF EXISTS "Admins can view escalation logs" ON public.escalation_logs;
    DROP POLICY IF EXISTS "Staff can view escalation logs" ON public.escalation_logs;
    CREATE POLICY "Admins can view escalation logs" ON public.escalation_logs FOR SELECT USING (is_admin(auth.uid()));
    CREATE POLICY "Staff can view escalation logs" ON public.escalation_logs FOR SELECT USING (is_staff(auth.uid()));
  END IF;
END $$;

-- maintenance_categories
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'maintenance_categories') THEN
    DROP POLICY IF EXISTS "Anyone authenticated can view maintenance categories" ON public.maintenance_categories;
    DROP POLICY IF EXISTS "Admins can manage maintenance categories" ON public.maintenance_categories;
    CREATE POLICY "Anyone authenticated can view maintenance categories" ON public.maintenance_categories FOR SELECT USING (auth.uid() IS NOT NULL);
    CREATE POLICY "Admins can manage maintenance categories" ON public.maintenance_categories FOR ALL USING (is_admin(auth.uid()));
  END IF;
END $$;

-- order_feedback
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_feedback') THEN
    DROP POLICY IF EXISTS "Users can view their own order feedback" ON public.order_feedback;
    DROP POLICY IF EXISTS "Users can create feedback for their orders" ON public.order_feedback;
    DROP POLICY IF EXISTS "Vendor staff can view feedback for their vendor" ON public.order_feedback;
    CREATE POLICY "Users can view their own order feedback" ON public.order_feedback FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can create feedback for their orders" ON public.order_feedback FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM cafeteria_orders WHERE id = order_feedback.order_id AND user_id = auth.uid()));
    CREATE POLICY "Vendor staff can view feedback for their vendor" ON public.order_feedback FOR SELECT USING (is_food_vendor_staff_for_vendor(auth.uid(), vendor_id));
  END IF;
END $$;

-- order_items
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_items') THEN
    DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
    DROP POLICY IF EXISTS "Vendor staff can view their vendor order items" ON public.order_items;
    CREATE POLICY "Users can view their order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM cafeteria_orders WHERE id = order_items.order_id AND user_id = auth.uid()));
    CREATE POLICY "Vendor staff can view their vendor order items" ON public.order_items FOR SELECT USING (EXISTS (SELECT 1 FROM cafeteria_orders co WHERE co.id = order_items.order_id AND is_food_vendor_staff_for_vendor(auth.uid(), co.vendor_id)));
  END IF;
END $$;

-- profile_audit_logs
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profile_audit_logs') THEN
    DROP POLICY IF EXISTS "Users can view their own profile audit logs" ON public.profile_audit_logs;
    DROP POLICY IF EXISTS "Admins can view all profile audit logs" ON public.profile_audit_logs;
    CREATE POLICY "Users can view their own profile audit logs" ON public.profile_audit_logs FOR SELECT USING (auth.uid() = profile_id);
    CREATE POLICY "Admins can view all profile audit logs" ON public.profile_audit_logs FOR SELECT USING (is_admin(auth.uid()));
  END IF;
END $$;

-- 4. STRENGTHEN PROFILES TABLE RLS
DROP POLICY IF EXISTS "staff_select_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view public profile fields only" ON public.profiles;
CREATE POLICY "Staff can view public profile fields only" ON public.profiles FOR SELECT USING (is_staff(auth.uid()) AND auth.uid() != id);

-- 5. STRENGTHEN USER_INVITATIONS TABLE RLS (Prevent email enumeration)
DROP POLICY IF EXISTS "Users can view their email invitations" ON public.user_invitations;
DROP POLICY IF EXISTS "Only admins can view invitations" ON public.user_invitations;
CREATE POLICY "Only admins can view invitations" ON public.user_invitations FOR SELECT USING (is_admin(auth.uid()));

-- Update secure invitation lookup function (prevents email enumeration)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'email', email,
    'first_name', first_name,
    'last_name', last_name,
    'role', role,
    'department', department,
    'expires_at', expires_at
  ) INTO invitation_data
  FROM user_invitations
  WHERE invitation_token = token
    AND status = 'pending'
    AND expires_at > now();
  
  RETURN invitation_data;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(uuid) TO anon;