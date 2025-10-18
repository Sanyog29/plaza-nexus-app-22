-- SECURITY FIX: Update all dependencies on profiles.role to use user_roles table instead
-- This prevents privilege escalation attacks by enforcing single source of truth for roles

-- Step 1: Update policies that check profiles.role to use user_roles instead

-- Fix shift_change_requests policy
DROP POLICY IF EXISTS "Admins can review shift requests" ON shift_change_requests;
CREATE POLICY "Admins can review shift requests" ON shift_change_requests
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix user_invitations policy  
DROP POLICY IF EXISTS "Admins can manage invitations" ON user_invitations;
CREATE POLICY "Admins can manage invitations" ON user_invitations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Fix request_time_extensions policy
DROP POLICY IF EXISTS "L2+ staff can update time extensions" ON request_time_extensions;
CREATE POLICY "L2+ staff can update time extensions" ON request_time_extensions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'assistant_manager', 'assistant_floor_manager', 
                    'assistant_general_manager', 'assistant_vice_president', 
                    'vp', 'ceo', 'cxo')
  )
);

-- Fix maintenance_requests policy
DROP POLICY IF EXISTS "Supervisors can update requests" ON maintenance_requests;
CREATE POLICY "Supervisors can update requests" ON maintenance_requests
FOR UPDATE
USING (
  is_staff(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'ops_supervisor')
  )
);

-- Fix profiles self-update policy to not allow role changes
DROP POLICY IF EXISTS "Users can update own profile (non-role fields)" ON profiles;
CREATE POLICY "Users can update own profile (non-role fields)" ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 2: Recreate views without role column dependency

-- Fix monthly_leaderboard view
DROP VIEW IF EXISTS monthly_leaderboard CASCADE;
CREATE VIEW monthly_leaderboard AS
SELECT 
  tp.technician_id,
  p.first_name,
  p.last_name,
  ur.role,  -- Get role from user_roles table
  tp.points_earned,
  tp.points_balance,
  tp.current_tier,
  tp.updated_at
FROM technician_points tp
LEFT JOIN profiles p ON p.id = tp.technician_id
LEFT JOIN user_roles ur ON ur.user_id = tp.technician_id
WHERE tp.updated_at >= date_trunc('month', CURRENT_DATE)
ORDER BY tp.points_earned DESC;

-- Fix public_profiles view
DROP VIEW IF EXISTS public_profiles CASCADE;
CREATE VIEW public_profiles AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.phone_number,
  p.user_category,
  p.department,
  p.approval_status,
  p.created_at,
  ur.role  -- Get role from user_roles table
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id;

-- Fix profiles_public view
DROP VIEW IF EXISTS profiles_public CASCADE;
CREATE VIEW profiles_public AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.phone_number,
  p.user_category,
  p.department,
  p.created_at,
  p.updated_at,
  p.approval_status,
  ur.role  -- Get role from user_roles table
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id;

-- Step 3: Now drop the role column from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS role CASCADE;

-- Add security audit comment
COMMENT ON TABLE profiles IS 'User profile information. Roles are stored ONLY in user_roles table (enforced for security - prevents privilege escalation).';