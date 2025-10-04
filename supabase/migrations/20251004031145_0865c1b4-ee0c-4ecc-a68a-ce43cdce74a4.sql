-- Secure profiles table: Strict RLS policies only (encryption requires app-level key management)

-- Drop all existing overly permissive policies on profiles
DROP POLICY IF EXISTS "Users can view all approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "temporary_security_lockdown" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view approved profiles" ON public.profiles;

-- STRICT RLS POLICIES: Only profile owner and admins

-- Policy 1: Users can ONLY view their own complete profile
CREATE POLICY "Users view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
);

-- Policy 2: Admins can view all profiles
CREATE POLICY "Admins view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_admin(auth.uid())
);

-- Policy 3: Users can ONLY update their own profile (with restrictions)
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  -- Prevent users from escalating their own privileges
  AND (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()))
  AND (approval_status IS NOT DISTINCT FROM (SELECT approval_status FROM public.profiles WHERE id = auth.uid()))
  AND (user_category IS NOT DISTINCT FROM (SELECT user_category FROM public.profiles WHERE id = auth.uid()))
);

-- Policy 4: Only admins can update any profile
CREATE POLICY "Admins update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy 5: New profiles can be created during signup
CREATE POLICY "Allow profile creation on signup"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Policy 6: Only admins can delete profiles
CREATE POLICY "Only admins delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add comments to mark sensitive fields
COMMENT ON COLUMN public.profiles.phone_number IS 'SENSITIVE: Personal contact information';
COMMENT ON COLUMN public.profiles.mobile_number IS 'SENSITIVE: Personal contact information';
COMMENT ON COLUMN public.profiles.email IS 'SENSITIVE: Personal contact information';
COMMENT ON COLUMN public.profiles.office_number IS 'SENSITIVE: Work contact information';
COMMENT ON COLUMN public.profiles.government_id IS 'CRITICAL: Government identification - highly sensitive';
COMMENT ON COLUMN public.profiles.employee_id IS 'SENSITIVE: Internal employee identifier';

-- Log this security hardening
INSERT INTO public.audit_logs (
  user_id,
  action,
  resource_type,
  new_values
) VALUES (
  auth.uid(),
  'security_hardening',
  'profiles_table',
  jsonb_build_object(
    'action', 'Applied strict RLS policies - profiles now restricted to owner and admins only',
    'timestamp', now(),
    'policies_created', 6,
    'sensitive_fields_marked', 6
  )
);