-- Create test user profiles for Test 1-6
-- Note: The actual auth.users entries need to be created via Supabase Auth API or dashboard

-- First, let's prepare profile data for our test users
INSERT INTO public.profiles (id, first_name, last_name, role, created_at, updated_at) VALUES
  -- These UUIDs will need to match the actual auth.users IDs when created
  ('11111111-1111-1111-1111-111111111111', 'Test', '1', 'tenant_manager'::app_role, now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'Test', '2', 'tenant_manager'::app_role, now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'Test', '3', 'field_staff'::app_role, now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'Test', '4', 'ops_supervisor'::app_role, now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'Test', '5', 'tenant_manager'::app_role, now(), now()),
  ('66666666-6666-6666-6666-666666666666', 'Test', '6', 'admin'::app_role, now(), now())
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  updated_at = EXCLUDED.updated_at;

-- Create a helper function to batch create auth users (for reference)
-- This function shows the structure but cannot actually create auth users
-- as that requires the Supabase Auth service
CREATE OR REPLACE FUNCTION create_test_users_info()
RETURNS TABLE(email text, password text, user_id uuid, name text, role text)
LANGUAGE sql
AS $$
  SELECT 
    'test1@example.com'::text, 'Test1234'::text, '11111111-1111-1111-1111-111111111111'::uuid, 'Test 1'::text, 'tenant_manager'::text
  UNION ALL
  SELECT 
    'test2@example.com'::text, 'Test1234'::text, '22222222-2222-2222-2222-222222222222'::uuid, 'Test 2'::text, 'tenant_manager'::text
  UNION ALL
  SELECT 
    'test3@example.com'::text, 'Test1234'::text, '33333333-3333-3333-3333-333333333333'::uuid, 'Test 3'::text, 'field_staff'::text
  UNION ALL
  SELECT 
    'test4@example.com'::text, 'Test1234'::text, '44444444-4444-4444-4444-444444444444'::uuid, 'Test 4'::text, 'ops_supervisor'::text
  UNION ALL
  SELECT 
    'test5@example.com'::text, 'Test1234'::text, '55555555-5555-5555-5555-555555555555'::uuid, 'Test 5'::text, 'tenant_manager'::text
  UNION ALL
  SELECT 
    'test6@example.com'::text, 'Test1234'::text, '66666666-6666-6666-6666-666666666666'::uuid, 'Test 6'::text, 'admin'::text;
$$;