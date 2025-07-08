-- Add some seed data for testing service categories and items
INSERT INTO service_categories (name, description, icon, is_active) VALUES
('Maintenance', 'General maintenance and repair services', 'Wrench', true),
('Cleaning', 'Cleaning and housekeeping services', 'Sparkles', true),
('Security', 'Security and safety services', 'Shield', true),
('Transport', 'Transportation and logistics services', 'Truck', true)
ON CONFLICT (name) DO NOTHING;

-- Add some seed service items (linking to categories)
INSERT INTO service_items (category_id, name, description, price, duration_minutes, is_available) 
SELECT 
  sc.id,
  'Basic Room Cleaning',
  'Standard room cleaning service including dusting, mopping, and sanitizing',
  150.00,
  30,
  true
FROM service_categories sc WHERE sc.name = 'Cleaning'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (category_id, name, description, price, duration_minutes, is_available) 
SELECT 
  sc.id,
  'AC Maintenance',
  'Air conditioning system maintenance and filter replacement',
  500.00,
  60,
  true
FROM service_categories sc WHERE sc.name = 'Maintenance'
ON CONFLICT DO NOTHING;

INSERT INTO service_items (category_id, name, description, price, duration_minutes, is_available) 
SELECT 
  sc.id,
  'Security Patrol',
  'Regular security patrol and monitoring service',
  200.00,
  120,
  true
FROM service_categories sc WHERE sc.name = 'Security'
ON CONFLICT DO NOTHING;

-- Make sure the current user has admin privileges for testing
-- Update the current user to admin role (replace with actual user ID if needed)
UPDATE profiles 
SET role = 'admin'::app_role 
WHERE id = auth.uid() AND auth.uid() IS NOT NULL;