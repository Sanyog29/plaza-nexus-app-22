-- Drop and recreate the view without security definer concerns
-- This view will rely on existing RLS policies on profiles and user_roles tables
DROP VIEW IF EXISTS profiles_with_role;

-- Create view that respects RLS policies
CREATE VIEW profiles_with_role WITH (security_invoker=true) AS
SELECT 
  p.*,
  ur.role::text as role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;

-- Grant access to authenticated users
GRANT SELECT ON profiles_with_role TO authenticated;