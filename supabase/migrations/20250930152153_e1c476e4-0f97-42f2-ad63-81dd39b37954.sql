-- Fix audit_logs security vulnerability
-- Remove overly permissive RLS policies that expose sensitive user activity data

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Food vendors can only see their own audit logs" ON public.audit_logs;

-- Create proper restrictive policies

-- 1. Admins can view all audit logs (keep existing)
-- Policy "Admins can view all audit logs" already exists

-- 2. Food vendors can ONLY view their own audit logs (fixed logic)
CREATE POLICY "Food vendors can view only their own audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  is_food_vendor(auth.uid()) AND user_id = auth.uid()
);

-- 3. Staff (ops supervisors, field staff) can view audit logs for operational purposes
CREATE POLICY "Staff can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  is_staff(auth.uid()) AND NOT is_food_vendor(auth.uid())
);

-- Add security comment to the table
COMMENT ON TABLE public.audit_logs IS 
'SECURITY NOTE: This table contains sensitive audit data including user IDs, IP addresses, and system changes. 
Access is restricted to administrators and authorized staff only. Regular users should NOT have access to audit logs 
as they contain system-level information that could be used to understand system vulnerabilities.';

-- Note: Regular users (tenants, etc.) will no longer be able to view audit logs directly.
-- This is intentional as audit logs are for system administration and compliance purposes only.