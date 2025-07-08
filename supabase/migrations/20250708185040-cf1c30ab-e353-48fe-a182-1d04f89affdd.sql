-- Add more test users to the profiles table for testing purposes
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, aud, role)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'john.smith@test.com', now(), now(), now(), 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'sarah.johnson@test.com', now(), now(), now(), 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'mike.wilson@test.com', now(), now(), now(), 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', 'emily.davis@test.com', now(), now(), now(), 'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', 'alex.brown@test.com', now(), now(), now(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Add corresponding profiles for these test users
INSERT INTO public.profiles (id, first_name, last_name, role, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'John', 'Smith', 'field_staff', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'Sarah', 'Johnson', 'ops_supervisor', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'Mike', 'Wilson', 'tenant_manager', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'Emily', 'Davis', 'vendor', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'Alex', 'Brown', 'field_staff', now(), now())
ON CONFLICT (id) DO NOTHING;