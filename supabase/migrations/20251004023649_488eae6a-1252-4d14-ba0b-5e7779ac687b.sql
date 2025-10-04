-- PHASE 1: IMMEDIATE SECURITY LOCKDOWN FOR PROFILES TABLE
-- This migration addresses critical data exposure vulnerability CVE-PROFILES-2025

-- Step 1: Drop the dangerous policy that allows unrestricted column access
DROP POLICY IF EXISTS "Users can view basic info of approved profiles" ON public.profiles;

-- Step 2: Create security definer function to return ONLY safe public fields
CREATE OR REPLACE FUNCTION public.get_public_profile_fields(profile_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  department text,
  floor text,
  zone text,
  bio text,
  skills text[],
  interests text[],
  designation text,
  role app_role,
  approval_status approval_status
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    id, 
    first_name, 
    last_name, 
    avatar_url, 
    department,
    floor, 
    zone, 
    bio, 
    skills, 
    interests, 
    designation,
    role, 
    approval_status
  FROM public.profiles
  WHERE id = profile_id 
    AND approval_status = 'approved';
$$;

-- Step 3: Create STRICT temporary lockdown policy
-- Users can ONLY see their own profile, admins can see all
CREATE POLICY "temporary_security_lockdown" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = id OR is_admin(auth.uid())
);

-- Step 4: Add explanatory comment
COMMENT ON POLICY "temporary_security_lockdown" ON public.profiles IS 
'EMERGENCY LOCKDOWN: Restricts all profile viewing to owner and admins only. Prevents sensitive data exposure (email, phone, government_id) while full column-level security is implemented.';

-- Step 5: Create audit log table for tracking sensitive data access
CREATE TABLE IF NOT EXISTS public.sensitive_profile_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  fields_accessed text[] NOT NULL,
  access_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on audit log table
ALTER TABLE public.sensitive_profile_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "admins_view_audit_logs" 
ON public.sensitive_profile_access_log 
FOR SELECT 
TO authenticated
USING (is_admin(auth.uid()));

-- System can insert audit logs (for future tracking)
CREATE POLICY "system_insert_audit_logs" 
ON public.sensitive_profile_access_log 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Create indexes for audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_log_target_user ON public.sensitive_profile_access_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_accessed_by ON public.sensitive_profile_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.sensitive_profile_access_log(created_at DESC);