-- Create sample data for testing and development

-- Insert sample maintenance categories
INSERT INTO maintenance_categories (name, description, icon) VALUES
('HVAC', 'Heating, Ventilation, and Air Conditioning', 'wind'),
('Electrical', 'Electrical systems and lighting', 'zap'),
('Plumbing', 'Water systems and pipes', 'droplets'),
('General', 'General maintenance and repairs', 'wrench'),
('Security', 'Security systems and access control', 'shield'),
('Cleaning', 'Janitorial and cleaning services', 'sparkles')
ON CONFLICT (name) DO NOTHING;

-- Insert sample assets
INSERT INTO assets (
  asset_name, asset_type, location, floor, zone, brand, model_number, 
  serial_number, status, purchase_date, installation_date, warranty_expiry,
  amc_vendor, amc_start_date, amc_end_date, amc_cost, service_frequency_months,
  last_service_date, next_service_due
) VALUES
('Main HVAC Unit A1', 'HVAC', 'Building A - Basement', 'B1', 'Zone A', 'Carrier', 'CA-2024-X1', 'CA24X1001', 'operational', '2023-01-15', '2023-02-01', '2026-01-15', 'CoolTech Services', '2023-02-01', '2024-12-31', 15000.00, 3, '2024-10-15', '2025-01-15'),
('Elevator System B1', 'Elevator', 'Building B - Lobby', 'G', 'Zone B', 'Otis', 'OT-2023-E5', 'OT23E5002', 'operational', '2022-05-20', '2022-06-15', '2025-05-20', 'Elevator Pro', '2022-06-15', '2024-12-31', 25000.00, 1, '2024-11-01', '2024-12-01'),
('Generator Backup G1', 'Generator', 'Building A - Roof', 'R1', 'Zone A', 'Caterpillar', 'CAT-2023-G100', 'CAT23G1003', 'operational', '2023-03-10', '2023-03-25', '2028-03-10', 'Power Solutions Inc', '2023-03-25', '2024-12-31', 8500.00, 6, '2024-09-25', '2025-03-25'),
('Security Camera System', 'Security', 'Building A - Multiple', 'All', 'Zone A', 'Hikvision', 'HIK-2024-SC200', 'HIK24SC004', 'operational', '2024-01-05', '2024-01-20', '2027-01-05', 'SecureVision Ltd', '2024-01-20', '2024-12-31', 12000.00, 12, '2024-01-20', '2025-01-20')
ON CONFLICT (serial_number) DO NOTHING;

-- Insert sample maintenance requests with realistic data
INSERT INTO maintenance_requests (
  title, description, priority, status, location, category_id, reported_by, 
  assigned_to, estimated_completion, created_at, updated_at
) VALUES
('HVAC Unit Making Noise', 'The main HVAC unit in Building A is making unusual grinding noises and vibrating excessively', 'high', 'in_progress', 'Building A - Basement', (SELECT id FROM maintenance_categories WHERE name = 'HVAC' LIMIT 1), 
  (SELECT id FROM profiles WHERE role = 'tenant_manager' LIMIT 1), 
  (SELECT id FROM profiles WHERE role = 'field_staff' LIMIT 1), 
  NOW() + INTERVAL '2 hours', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour'),
  
('Fluorescent Light Flickering', 'Multiple fluorescent lights in the 3rd floor corridor are flickering intermittently', 'medium', 'pending', 'Building B - 3rd Floor Corridor', 
  (SELECT id FROM maintenance_categories WHERE name = 'Electrical' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'tenant_manager' LIMIT 1), 
  NULL, NOW() + INTERVAL '4 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),
  
('Water Leak in Restroom', 'Small water leak detected under sink in mens restroom on 2nd floor', 'urgent', 'assigned', 'Building A - 2nd Floor Mens Restroom',
  (SELECT id FROM maintenance_categories WHERE name = 'Plumbing' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'tenant_manager' LIMIT 1), 
  (SELECT id FROM profiles WHERE role = 'field_staff' LIMIT 1), 
  NOW() + INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '15 minutes'),
  
('Door Lock Malfunction', 'Electronic door lock on main entrance is not responding to key cards', 'high', 'completed', 'Building A - Main Entrance',
  (SELECT id FROM maintenance_categories WHERE name = 'Security' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'tenant_manager' LIMIT 1), 
  (SELECT id FROM profiles WHERE role = 'field_staff' LIMIT 1), 
  NOW() - INTERVAL '1 hour', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '30 minutes'),
  
('Carpet Cleaning Needed', 'Conference room carpet needs deep cleaning after beverage spill', 'low', 'pending', 'Building B - Conference Room 201',
  (SELECT id FROM maintenance_categories WHERE name = 'Cleaning' LIMIT 1),
  (SELECT id FROM profiles WHERE role = 'tenant_manager' LIMIT 1), 
  NULL, NOW() + INTERVAL '24 hours', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours');

-- Insert performance metrics for the last 30 days
INSERT INTO performance_metrics (metric_date, total_requests, completed_requests, average_completion_time_minutes, sla_breaches)
SELECT 
  date_series.date,
  FLOOR(RANDOM() * 15) + 5 as total_requests,
  FLOOR(RANDOM() * 12) + 3 as completed_requests,
  FLOOR(RANDOM() * 240) + 60 as average_completion_time_minutes,
  FLOOR(RANDOM() * 3) as sla_breaches
FROM (
  SELECT date_trunc('day', NOW() - INTERVAL '1 day' * generate_series(0, 29)) as date
) date_series
ON CONFLICT (metric_date) DO UPDATE SET
  total_requests = EXCLUDED.total_requests,
  completed_requests = EXCLUDED.completed_requests,
  average_completion_time_minutes = EXCLUDED.average_completion_time_minutes,
  sla_breaches = EXCLUDED.sla_breaches;

-- Update completed maintenance request timestamps
UPDATE maintenance_requests 
SET completed_at = created_at + INTERVAL '2 hours' 
WHERE status = 'completed' AND completed_at IS NULL;

-- Create some AMC alerts for testing
INSERT INTO amc_alerts (asset_id, alert_type, alert_date, due_date, notes)
SELECT 
  a.id,
  'service_due',
  CURRENT_DATE + INTERVAL '7 days',
  a.next_service_due,
  'Preventive maintenance service due soon'
FROM assets a 
WHERE a.next_service_due > CURRENT_DATE
ON CONFLICT DO NOTHING;

-- Insert sample system alerts
INSERT INTO alerts (title, message, severity, expires_at) VALUES
('Scheduled Maintenance Window', 'System maintenance scheduled for this weekend from 2 AM to 6 AM', 'info', NOW() + INTERVAL '7 days'),
('High CPU Usage Detected', 'Server CPU usage has exceeded 90% for the past 15 minutes', 'warning', NOW() + INTERVAL '1 day'),
('Backup Completion', 'Daily backup completed successfully at 3:00 AM', 'info', NOW() + INTERVAL '12 hours')
ON CONFLICT DO NOTHING;

-- Insert visitor categories
INSERT INTO visitor_categories (name, description, icon, color) VALUES
('Business', 'Business meetings and professional visits', 'briefcase', '#3B82F6'),
('Delivery', 'Package and document deliveries', 'package', '#F59E0B'),
('Maintenance', 'Maintenance and repair personnel', 'wrench', '#10B981'),
('Guest', 'Personal guests and family visits', 'user', '#8B5CF6'),
('Contractor', 'External contractors and consultants', 'hard-hat', '#EF4444')
ON CONFLICT (name) DO NOTHING;