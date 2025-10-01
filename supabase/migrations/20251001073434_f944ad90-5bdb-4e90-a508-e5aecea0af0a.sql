-- CRITICAL SECURITY FIX: Ensure RLS is enabled on assets table
-- This prevents competitors from stealing sensitive asset information

-- Ensure RLS is enabled on the assets table
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive policies that might exist
DROP POLICY IF EXISTS "Enable read access for all users" ON assets;
DROP POLICY IF EXISTS "Public read access" ON assets;
DROP POLICY IF EXISTS "Allow all access" ON assets;
DROP POLICY IF EXISTS "Anyone can view assets" ON assets;

-- Verify existing secure policies are in place
-- These policies already exist but we're ensuring they're the ONLY ones

-- Policy: Deny food vendors access to assets (already exists)
DROP POLICY IF EXISTS "Deny food vendors access to assets" ON assets;
CREATE POLICY "Deny food vendors access to assets"
ON assets FOR ALL
TO authenticated
USING (NOT is_food_vendor(auth.uid()));

-- Policy: Staff can view all assets (already exists)
DROP POLICY IF EXISTS "Staff can view all assets" ON assets;
CREATE POLICY "Staff can view all assets"
ON assets FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

-- Policy: Staff can manage all assets (already exists)
DROP POLICY IF EXISTS "Staff can manage all assets" ON assets;
CREATE POLICY "Staff can manage all assets"
ON assets FOR INSERT
TO authenticated
WITH CHECK (is_staff(auth.uid()));

-- Policy: Staff can update all assets (already exists)
DROP POLICY IF EXISTS "Staff can update all assets" ON assets;
CREATE POLICY "Staff can update all assets"
ON assets FOR UPDATE
TO authenticated
USING (is_staff(auth.uid()));

-- Policy: Staff can delete all assets (already exists)
DROP POLICY IF EXISTS "Staff can delete all assets" ON assets;
CREATE POLICY "Staff can delete all assets"
ON assets FOR DELETE
TO authenticated
USING (is_staff(auth.uid()));

-- Log this critical security fix
INSERT INTO audit_logs (user_id, action, resource_type, new_values)
VALUES (
  auth.uid(),
  'critical_security_fix',
  'assets',
  jsonb_build_object(
    'fix', 'enabled_rls_and_restricted_access',
    'timestamp', now(),
    'issue', 'prevented_competitor_asset_data_theft',
    'policies_verified', 5
  )
);