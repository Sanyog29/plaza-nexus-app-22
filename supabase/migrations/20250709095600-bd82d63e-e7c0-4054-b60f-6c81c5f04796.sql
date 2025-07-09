
-- Create maintenance categories
INSERT INTO categories (name, description, icon) VALUES
  ('Electrical', 'Electrical issues, power outages, lighting problems', 'zap'),
  ('Plumbing', 'Water leaks, drain issues, toilet problems', 'droplets'),
  ('HVAC', 'Heating, ventilation, air conditioning issues', 'thermometer'),
  ('Cleaning', 'Housekeeping, sanitation, waste management', 'sparkles'),
  ('Security', 'Access control, locks, safety concerns', 'shield'),
  ('IT Support', 'Computer, network, printer issues', 'monitor'),
  ('General Maintenance', 'Other maintenance and repair issues', 'wrench'),
  ('Safety', 'Safety hazards, emergency repairs', 'alert-triangle')
ON CONFLICT (name) DO NOTHING;
