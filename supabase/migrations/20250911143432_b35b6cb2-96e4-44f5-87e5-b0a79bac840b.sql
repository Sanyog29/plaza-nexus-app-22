-- Add some sample vendors if none exist
INSERT INTO vendors (
  name,
  description,
  contact_email,
  contact_phone,
  cuisine_type,
  is_active,
  commission_rate,
  stall_location
) 
SELECT * FROM (VALUES
  ('Hadid''s Food', 'Authentic Middle Eastern cuisine with fresh ingredients', 'ahmad@hadidsfood.com', '+1234567890', 'Middle Eastern', true, 15.0, 'Food Court Level 1 - Stall A'),
  ('Fresh Bites Cafe', 'Healthy salads and sandwiches made daily', 'sarah@freshbites.com', '+1234567891', 'Healthy', true, 12.0, 'Food Court Level 1 - Stall B'),
  ('Spice Garden', 'Traditional Indian spices and curries', 'raj@spicegarden.com', '+1234567892', 'Indian', true, 18.0, 'Food Court Level 2 - Stall C')
) AS v(name, description, contact_email, contact_phone, cuisine_type, is_active, commission_rate, stall_location)
WHERE NOT EXISTS (SELECT 1 FROM vendors LIMIT 1);