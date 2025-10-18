-- CRITICAL SECURITY FIX: Part 1 - Clean data and fix structure

-- Step 1: Remove duplicate profiles (keep the most recent one)
DELETE FROM public.profiles p1
USING public.profiles p2
WHERE p1.id = p2.id
  AND p1.created_at < p2.created_at;

-- Step 2: Fix all SECURITY DEFINER functions to have immutable search_path
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.is_staff(uuid) SET search_path = public;
ALTER FUNCTION public.is_food_vendor(uuid) SET search_path = public;
ALTER FUNCTION public.is_l2(uuid) SET search_path = public;
ALTER FUNCTION public.is_l3(uuid) SET search_path = public;
ALTER FUNCTION public.is_l4(uuid) SET search_path = public;
ALTER FUNCTION public.is_management(uuid) SET search_path = public;
ALTER FUNCTION public.can_view_profile_sensitive_data(uuid) SET search_path = public;
ALTER FUNCTION public.log_audit_event(text, text, uuid, jsonb, jsonb) SET search_path = public;
ALTER FUNCTION public.toggle_access_point_lock(uuid, boolean) SET search_path = public;
ALTER FUNCTION public.acknowledge_ticket(uuid) SET search_path = public;
ALTER FUNCTION public.update_user_role(uuid, text, uuid) SET search_path = public;
ALTER FUNCTION public.admin_approve_vendor(uuid) SET search_path = public;
ALTER FUNCTION public.admin_bulk_create_users(jsonb) SET search_path = public;
ALTER FUNCTION public.get_user_management_stats() SET search_path = public;
ALTER FUNCTION public.get_user_management_data() SET search_path = public;
ALTER FUNCTION public.admin_cascade_delete_user_data(uuid) SET search_path = public;
ALTER FUNCTION public.get_invitation_details(uuid) SET search_path = public;
ALTER FUNCTION public.get_role_defaults(text) SET search_path = public;
ALTER FUNCTION public.execute_workflow_trigger(text, jsonb) SET search_path = public;
ALTER FUNCTION public.calculate_cross_module_kpis() SET search_path = public;
ALTER FUNCTION public.calculate_staff_workload_score(uuid) SET search_path = public;
ALTER FUNCTION public.suggest_optimal_staff_assignment(text, text[], text) SET search_path = public;
ALTER FUNCTION public.soft_delete_maintenance_requests(uuid[], uuid) SET search_path = public;
ALTER FUNCTION public.assign_and_start_request(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.accept_request_offer(uuid) SET search_path = public;
ALTER FUNCTION public.decline_request_offer(uuid) SET search_path = public;
ALTER FUNCTION public.update_staff_availability(text, integer) SET search_path = public;

-- Step 3: Create secure function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = target_user_id
  LIMIT 1;
$$;

-- Step 4: Drop the insecure role sync trigger
DROP TRIGGER IF EXISTS sync_user_role ON public.user_roles;

-- Step 5: Consolidate RLS policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Food vendors can only view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Food vendors cannot access other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block food vendor updates to sensitive fields" ON public.profiles;
DROP POLICY IF EXISTS "Prevent food vendors from seeing other profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable food vendors to view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable food vendors to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "System can create profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

-- Create clean RLS policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Step 6: Deprecate role column in profiles
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;
COMMENT ON COLUMN public.profiles.role IS 'DEPRECATED: Use user_roles table instead';

-- Step 7: Create security audit log
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  ip_address inet,
  user_agent text,
  success boolean NOT NULL,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view security logs"
  ON public.security_audit_log FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Step 8: Input sanitization function
CREATE OR REPLACE FUNCTION public.sanitize_text_input(input text, max_length integer DEFAULT 255)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE STRICT
SET search_path = public
AS $$
BEGIN
  IF input IS NULL THEN RETURN NULL; END IF;
  input := trim(input);
  IF length(input) > max_length THEN
    RAISE EXCEPTION 'Input exceeds maximum length of %', max_length;
  END IF;
  input := regexp_replace(input, '[<>]', '', 'g');
  RETURN input;
END;
$$;