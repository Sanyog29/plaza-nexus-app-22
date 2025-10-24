-- Assign all existing users to the Default Property
-- This migration ensures all existing users are properly linked to the Default Property

INSERT INTO property_assignments (user_id, property_id, is_primary)
SELECT 
  id as user_id,
  'b91ccd9a-56ca-4021-a7c2-ac7d24473bf1' as property_id,
  true as is_primary
FROM profiles
WHERE id NOT IN (SELECT user_id FROM property_assignments)
ON CONFLICT (user_id, property_id) DO NOTHING;