-- CRITICAL SECURITY FIX: Enable RLS on maintenance_requests table
-- This prevents competitors from stealing customer maintenance data

-- First, ensure RLS is enabled on the table
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON maintenance_requests;
DROP POLICY IF EXISTS "Public read access" ON maintenance_requests;
DROP POLICY IF EXISTS "Allow all access" ON maintenance_requests;

-- Ensure our secure policies are in place
DROP POLICY IF EXISTS "Users can view their own requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Staff can manage all requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can create requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can update their own pending requests" ON maintenance_requests;

-- Policy 1: Users can only view requests they reported or are assigned to
CREATE POLICY "Users can view their own requests"
ON maintenance_requests FOR SELECT
TO authenticated
USING (
  reported_by = auth.uid() 
  OR assigned_to = auth.uid() 
  OR is_staff(auth.uid())
);

-- Policy 2: Users can create their own maintenance requests
CREATE POLICY "Users can create requests"
ON maintenance_requests FOR INSERT
TO authenticated
WITH CHECK (reported_by = auth.uid());

-- Policy 3: Users can update their own pending requests only
CREATE POLICY "Users can update their own pending requests"
ON maintenance_requests FOR UPDATE
TO authenticated
USING (
  reported_by = auth.uid() 
  AND status = 'pending'
);

-- Policy 4: Staff can manage all requests (full CRUD access)
CREATE POLICY "Staff can manage all requests"
ON maintenance_requests FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Verify no anonymous access exists by ensuring only authenticated users can access
-- (The above policies only apply to 'authenticated' role, not 'anon' role)

-- Log this critical security fix
INSERT INTO audit_logs (user_id, action, resource_type, new_values)
VALUES (
  auth.uid(),
  'critical_security_fix',
  'maintenance_requests',
  jsonb_build_object(
    'fix', 'enabled_rls_and_restricted_access',
    'timestamp', now(),
    'issue', 'prevented_competitor_data_theft',
    'policies_added', 4
  )
);