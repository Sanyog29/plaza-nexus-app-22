-- Insert sample maintenance categories
INSERT INTO maintenance_categories (name, description, icon) VALUES
('HVAC', 'Heating, Ventilation, and Air Conditioning', 'wind'),
('Electrical', 'Electrical systems and lighting', 'zap'),
('Plumbing', 'Water systems and pipes', 'droplets'),
('General', 'General maintenance and repairs', 'wrench'),
('Security', 'Security systems and access control', 'shield'),
('Cleaning', 'Janitorial and cleaning services', 'sparkles');

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
('Security Camera System', 'Security', 'Building A - Multiple', 'All', 'Zone A', 'Hikvision', 'HIK-2024-SC200', 'HIK24SC004', 'operational', '2024-01-05', '2024-01-20', '2027-01-05', 'SecureVision Ltd', '2024-01-20', '2024-12-31', 12000.00, 12, '2024-01-20', '2025-01-20');

-- Insert sample system alerts
INSERT INTO alerts (title, message, severity, expires_at) VALUES
('Scheduled Maintenance Window', 'System maintenance scheduled for this weekend from 2 AM to 6 AM', 'info', NOW() + INTERVAL '7 days'),
('High CPU Usage Detected', 'Server CPU usage has exceeded 90% for the past 15 minutes', 'warning', NOW() + INTERVAL '1 day'),
('Backup Completion', 'Daily backup completed successfully at 3:00 AM', 'info', NOW() + INTERVAL '12 hours');

-- Insert performance metrics for the last 30 days
INSERT INTO performance_metrics (metric_date, total_requests, completed_requests, average_completion_time_minutes, sla_breaches)
SELECT 
  date_series.date::date,
  FLOOR(RANDOM() * 15) + 5 as total_requests,
  FLOOR(RANDOM() * 12) + 3 as completed_requests,
  FLOOR(RANDOM() * 240) + 60 as average_completion_time_minutes,
  FLOOR(RANDOM() * 3) as sla_breaches
FROM (
  SELECT date_trunc('day', NOW() - INTERVAL '1 day' * generate_series(0, 29)) as date
) date_series;