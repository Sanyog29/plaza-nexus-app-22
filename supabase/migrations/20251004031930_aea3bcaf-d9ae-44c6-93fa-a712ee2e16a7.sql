-- ============================================================================
-- CRITICAL SECURITY FIX: Lock Down Profiles Table
-- ============================================================================
-- Implements strict RLS policies to prevent unauthorized access to employee data
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- RLS POLICIES: Users can only view/edit their own profile
-- ============================================================================

-- SELECT: Users see only their own profile
CREATE POLICY "users_select_own_profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- SELECT: Admins see all profiles
CREATE POLICY "admins_select_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- SELECT: Staff see all profiles (operational needs)
CREATE POLICY "staff_select_all_profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

-- UPDATE: Users update only their own profile
CREATE POLICY "users_update_own_profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: Admins update all profiles
CREATE POLICY "admins_update_all_profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- INSERT: Only admins can create profiles
CREATE POLICY "admins_insert_profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

-- DELETE: Only admins can delete profiles
CREATE POLICY "admins_delete_profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- ============================================================================
-- TRIGGER: Prevent privilege escalation attacks
-- ============================================================================

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Non-admins cannot change security-critical fields
  IF NOT public.is_admin(auth.uid()) THEN
    IF (OLD.role IS DISTINCT FROM NEW.role) OR
       (OLD.approval_status IS DISTINCT FROM NEW.approval_status) OR
       (OLD.approved_by IS DISTINCT FROM NEW.approved_by) OR
       (OLD.approved_at IS DISTINCT FROM NEW.approved_at) OR
       (OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason) THEN
      RAISE EXCEPTION 'Access denied: Only administrators can modify role or approval fields';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_privilege_escalation ON public.profiles;

CREATE TRIGGER prevent_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'SECURED: Sensitive employee data with strict RLS. Users can only access their own profile. Admins/staff have operational access. Encrypted fields require special decryption permissions.';