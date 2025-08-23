-- Insert main categories if they don't exist
INSERT INTO main_categories (name, description, icon, color, sort_order) VALUES
('Workstation & Furniture', 'Office furniture and workstation issues', '🪑', '#8B5CF6', 1),
('Electrical & Lighting', 'Power, electrical systems and lighting', '⚡', '#F59E0B', 2),
('HVAC & Air Quality', 'Air conditioning, heating and air quality', '❄️', '#06B6D4', 3),
('Plumbing & Washrooms', 'Water systems and washroom facilities', '🚿', '#3B82F6', 4),
('Housekeeping & Cleaning', 'Cleaning services and maintenance', '🧹', '#10B981', 5),
('Pantry & F&B', 'Kitchen facilities and food services', '☕', '#F97316', 6),
('Security & Access Control', 'Security systems and access management', '🔒', '#DC2626', 7),
('IT & Connectivity', 'Network, computers and IT infrastructure', '💻', '#6366F1', 8),
('AV & Meeting Rooms', 'Audio visual equipment and meeting facilities', '📺', '#8B5CF6', 9),
('Lifts & Vertical Transport', 'Elevators and vertical transportation', '🛗', '#64748B', 10),
('Building Services', 'General building maintenance and repairs', '🏢', '#84CC16', 11),
('Environment & Sustainability', 'Environmental and sustainability initiatives', '🌱', '#22C55E', 12),
('Health & Safety', 'Safety systems and health related issues', '🏥', '#EF4444', 13),
('Business Support & Admin', 'Administrative and business support services', '📋', '#6B7280', 14),
('Events & Community', 'Event management and community activities', '🎉', '#EC4899', 15),
('Other / General', 'Unclassified or general issues', '📝', '#6B7280', 16)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- Insert sub-categories for each main category
WITH category_mappings AS (
  SELECT 
    mc.id as main_category_id,
    mc.name as category_name
  FROM main_categories mc
)

-- Workstation & Furniture
INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) 
SELECT main_category_id, 'Chair broken', 'Broken or damaged office chair', 'medium', 120
FROM category_mappings WHERE category_name = 'Workstation & Furniture'
UNION ALL
SELECT main_category_id, 'Desk alignment', 'Desk positioning or height adjustment', 'low', 60
FROM category_mappings WHERE category_name = 'Workstation & Furniture'
UNION ALL
SELECT main_category_id, 'Locker not opening', 'Personal locker access issues', 'medium', 90
FROM category_mappings WHERE category_name = 'Workstation & Furniture'
UNION ALL
SELECT main_category_id, 'Furniture damage', 'General furniture repair or replacement', 'medium', 180
FROM category_mappings WHERE category_name = 'Workstation & Furniture'
UNION ALL
SELECT main_category_id, 'Ergonomic adjustment', 'Workstation ergonomic setup', 'low', 45
FROM category_mappings WHERE category_name = 'Workstation & Furniture'

-- Electrical & Lighting  
UNION ALL
SELECT main_category_id, 'Power outage', 'Electrical power interruption', 'urgent', 30
FROM category_mappings WHERE category_name = 'Electrical & Lighting'
UNION ALL
SELECT main_category_id, 'Socket fault', 'Electrical outlet not working', 'high', 90
FROM category_mappings WHERE category_name = 'Electrical & Lighting'
UNION ALL
SELECT main_category_id, 'UPS failure', 'Uninterruptible power supply issues', 'urgent', 60
FROM category_mappings WHERE category_name = 'Electrical & Lighting'
UNION ALL
SELECT main_category_id, 'Light not working', 'Lighting fixtures or bulbs', 'medium', 60
FROM category_mappings WHERE category_name = 'Electrical & Lighting'
UNION ALL
SELECT main_category_id, 'Circuit breaker trip', 'Electrical circuit protection issues', 'high', 45
FROM category_mappings WHERE category_name = 'Electrical & Lighting'

-- HVAC & Air Quality
UNION ALL
SELECT main_category_id, 'AC breakdown (bay)', 'Air conditioning unit failure', 'urgent', 120
FROM category_mappings WHERE category_name = 'HVAC & Air Quality'
UNION ALL
SELECT main_category_id, 'Uneven cooling', 'Temperature variation across areas', 'medium', 180
FROM category_mappings WHERE category_name = 'HVAC & Air Quality'
UNION ALL
SELECT main_category_id, 'Filter cleaning', 'HVAC filter maintenance', 'low', 90
FROM category_mappings WHERE category_name = 'HVAC & Air Quality'
UNION ALL
SELECT main_category_id, 'Ventilation issues', 'Poor air circulation or quality', 'medium', 120
FROM category_mappings WHERE category_name = 'HVAC & Air Quality'
UNION ALL
SELECT main_category_id, 'Thermostat malfunction', 'Temperature control not working', 'medium', 60
FROM category_mappings WHERE category_name = 'HVAC & Air Quality'

-- Plumbing & Washrooms
UNION ALL
SELECT main_category_id, 'Flush not working', 'Toilet flush mechanism failure', 'high', 90
FROM category_mappings WHERE category_name = 'Plumbing & Washrooms'
UNION ALL
SELECT main_category_id, 'Tap leakage', 'Water tap or faucet leaking', 'medium', 60
FROM category_mappings WHERE category_name = 'Plumbing & Washrooms'
UNION ALL
SELECT main_category_id, 'No water supply', 'Complete water supply interruption', 'urgent', 60
FROM category_mappings WHERE category_name = 'Plumbing & Washrooms'
UNION ALL
SELECT main_category_id, 'Washroom maintenance', 'General washroom repairs', 'medium', 120
FROM category_mappings WHERE category_name = 'Plumbing & Washrooms'
UNION ALL
SELECT main_category_id, 'Drainage blockage', 'Blocked drains or sewage', 'high', 120
FROM category_mappings WHERE category_name = 'Plumbing & Washrooms'

-- Housekeeping & Cleaning
UNION ALL
SELECT main_category_id, 'Daily cleaning', 'Regular cleaning services', 'low', 180
FROM category_mappings WHERE category_name = 'Housekeeping & Cleaning'
UNION ALL
SELECT main_category_id, 'Dusting', 'Dust removal and surface cleaning', 'low', 120
FROM category_mappings WHERE category_name = 'Housekeeping & Cleaning'
UNION ALL
SELECT main_category_id, 'Deep cleaning', 'Thorough cleaning of areas', 'low', 360
FROM category_mappings WHERE category_name = 'Housekeeping & Cleaning'
UNION ALL
SELECT main_category_id, 'Pest control', 'Pest management and extermination', 'medium', 240
FROM category_mappings WHERE category_name = 'Housekeeping & Cleaning'
UNION ALL
SELECT main_category_id, 'Waste management', 'Garbage collection and disposal', 'medium', 90
FROM category_mappings WHERE category_name = 'Housekeeping & Cleaning'

-- Pantry & F&B
UNION ALL
SELECT main_category_id, 'Coffee machine down', 'Coffee maker not functioning', 'medium', 120
FROM category_mappings WHERE category_name = 'Pantry & F&B'
UNION ALL
SELECT main_category_id, 'Stock shortage', 'Pantry supplies running low', 'low', 480
FROM category_mappings WHERE category_name = 'Pantry & F&B'
UNION ALL
SELECT main_category_id, 'Vendor delay', 'Food service vendor issues', 'medium', 240
FROM category_mappings WHERE category_name = 'Pantry & F&B'
UNION ALL
SELECT main_category_id, 'Appliance maintenance', 'Kitchen appliance repairs', 'medium', 180
FROM category_mappings WHERE category_name = 'Pantry & F&B'
UNION ALL
SELECT main_category_id, 'Hygiene concerns', 'Food safety and cleanliness', 'high', 90
FROM category_mappings WHERE category_name = 'Pantry & F&B'

-- Security & Access Control
UNION ALL
SELECT main_category_id, 'ID card issues', 'Access card not working', 'high', 60
FROM category_mappings WHERE category_name = 'Security & Access Control'
UNION ALL
SELECT main_category_id, 'Turnstile not working', 'Entry gate malfunction', 'high', 90
FROM category_mappings WHERE category_name = 'Security & Access Control'
UNION ALL
SELECT main_category_id, 'CCTV fault', 'Security camera not functioning', 'high', 120
FROM category_mappings WHERE category_name = 'Security & Access Control'
UNION ALL
SELECT main_category_id, 'Door lock malfunction', 'Electronic door lock issues', 'high', 90
FROM category_mappings WHERE category_name = 'Security & Access Control'
UNION ALL
SELECT main_category_id, 'Visitor access', 'Guest entry and escort issues', 'medium', 45
FROM category_mappings WHERE category_name = 'Security & Access Control'

-- IT & Connectivity
UNION ALL
SELECT main_category_id, 'Wi-Fi down', 'Wireless network connectivity issues', 'high', 90
FROM category_mappings WHERE category_name = 'IT & Connectivity'
UNION ALL
SELECT main_category_id, 'Printer error', 'Printer malfunction or setup', 'medium', 60
FROM category_mappings WHERE category_name = 'IT & Connectivity'
UNION ALL
SELECT main_category_id, 'LAN port dead', 'Ethernet connection not working', 'medium', 90
FROM category_mappings WHERE category_name = 'IT & Connectivity'
UNION ALL
SELECT main_category_id, 'Network slowdown', 'Slow internet or network performance', 'medium', 120
FROM category_mappings WHERE category_name = 'IT & Connectivity'
UNION ALL
SELECT main_category_id, 'Software issues', 'Application or system software problems', 'medium', 180
FROM category_mappings WHERE category_name = 'IT & Connectivity'

-- AV & Meeting Rooms
UNION ALL
SELECT main_category_id, 'VC not connecting', 'Video conferencing setup issues', 'high', 90
FROM category_mappings WHERE category_name = 'AV & Meeting Rooms'
UNION ALL
SELECT main_category_id, 'Display not working', 'Projector or screen malfunction', 'high', 60
FROM category_mappings WHERE category_name = 'AV & Meeting Rooms'
UNION ALL
SELECT main_category_id, 'Booking issue', 'Room reservation problems', 'medium', 30
FROM category_mappings WHERE category_name = 'AV & Meeting Rooms'
UNION ALL
SELECT main_category_id, 'Audio problems', 'Sound system or microphone issues', 'medium', 60
FROM category_mappings WHERE category_name = 'AV & Meeting Rooms'
UNION ALL
SELECT main_category_id, 'Remote control missing', 'AV equipment remote not available', 'low', 30
FROM category_mappings WHERE category_name = 'AV & Meeting Rooms'

-- Lifts & Vertical Transport
UNION ALL
SELECT main_category_id, 'Lift breakdown', 'Elevator completely out of service', 'urgent', 60
FROM category_mappings WHERE category_name = 'Lifts & Vertical Transport'
UNION ALL
SELECT main_category_id, 'Stuck lift', 'People trapped in elevator', 'urgent', 15
FROM category_mappings WHERE category_name = 'Lifts & Vertical Transport'
UNION ALL
SELECT main_category_id, 'Call button not working', 'Elevator call button malfunction', 'high', 60
FROM category_mappings WHERE category_name = 'Lifts & Vertical Transport'
UNION ALL
SELECT main_category_id, 'Door issues', 'Elevator door not opening/closing properly', 'high', 90
FROM category_mappings WHERE category_name = 'Lifts & Vertical Transport'
UNION ALL
SELECT main_category_id, 'Unusual noise', 'Elevator making strange sounds', 'medium', 120
FROM category_mappings WHERE category_name = 'Lifts & Vertical Transport'

-- Building Services
UNION ALL
SELECT main_category_id, 'Ceiling tile damage', 'Damaged or missing ceiling tiles', 'medium', 180
FROM category_mappings WHERE category_name = 'Building Services'
UNION ALL
SELECT main_category_id, 'Wall painting', 'Wall maintenance and painting', 'low', 480
FROM category_mappings WHERE category_name = 'Building Services'
UNION ALL
SELECT main_category_id, 'Glass crack', 'Broken or cracked windows/glass', 'high', 240
FROM category_mappings WHERE category_name = 'Building Services'
UNION ALL
SELECT main_category_id, 'Flooring issues', 'Floor damage or maintenance', 'medium', 360
FROM category_mappings WHERE category_name = 'Building Services'
UNION ALL
SELECT main_category_id, 'Structural repairs', 'Building structural maintenance', 'high', 720
FROM category_mappings WHERE category_name = 'Building Services'

-- Environment & Sustainability
UNION ALL
SELECT main_category_id, 'Waste segregation', 'Proper waste sorting and disposal', 'medium', 120
FROM category_mappings WHERE category_name = 'Environment & Sustainability'
UNION ALL
SELECT main_category_id, 'Recycling', 'Recycling program and bins', 'low', 180
FROM category_mappings WHERE category_name = 'Environment & Sustainability'
UNION ALL
SELECT main_category_id, 'Solar / energy issues', 'Renewable energy system problems', 'medium', 240
FROM category_mappings WHERE category_name = 'Environment & Sustainability'
UNION ALL
SELECT main_category_id, 'Energy efficiency', 'Power saving and efficiency measures', 'low', 360
FROM category_mappings WHERE category_name = 'Environment & Sustainability'
UNION ALL
SELECT main_category_id, 'Environmental compliance', 'Environmental regulations and reporting', 'medium', 480
FROM category_mappings WHERE category_name = 'Environment & Sustainability'

-- Health & Safety
UNION ALL
SELECT main_category_id, 'Fire alarm', 'Fire alarm system issues', 'urgent', 30
FROM category_mappings WHERE category_name = 'Health & Safety'
UNION ALL
SELECT main_category_id, 'First aid', 'Medical emergency or first aid needs', 'urgent', 15
FROM category_mappings WHERE category_name = 'Health & Safety'
UNION ALL
SELECT main_category_id, 'PPE', 'Personal protective equipment requirements', 'medium', 240
FROM category_mappings WHERE category_name = 'Health & Safety'
UNION ALL
SELECT main_category_id, 'Fire drills', 'Emergency evacuation procedures', 'medium', 180
FROM category_mappings WHERE category_name = 'Health & Safety'
UNION ALL
SELECT main_category_id, 'Safety compliance', 'Workplace safety regulations', 'high', 360
FROM category_mappings WHERE category_name = 'Health & Safety'

-- Business Support & Admin
UNION ALL
SELECT main_category_id, 'Courier', 'Package delivery and mail services', 'low', 120
FROM category_mappings WHERE category_name = 'Business Support & Admin'
UNION ALL
SELECT main_category_id, 'Stationery', 'Office supplies and stationery', 'low', 240
FROM category_mappings WHERE category_name = 'Business Support & Admin'
UNION ALL
SELECT main_category_id, 'Visitor support', 'Guest services and visitor assistance', 'medium', 60
FROM category_mappings WHERE category_name = 'Business Support & Admin'
UNION ALL
SELECT main_category_id, 'Documentation', 'Administrative paperwork and forms', 'low', 180
FROM category_mappings WHERE category_name = 'Business Support & Admin'
UNION ALL
SELECT main_category_id, 'Reception services', 'Front desk and reception support', 'medium', 90
FROM category_mappings WHERE category_name = 'Business Support & Admin'

-- Events & Community
UNION ALL
SELECT main_category_id, 'Space booking', 'Event space reservation', 'medium', 60
FROM category_mappings WHERE category_name = 'Events & Community'
UNION ALL
SELECT main_category_id, 'Event support', 'Event setup and coordination', 'medium', 240
FROM category_mappings WHERE category_name = 'Events & Community'
UNION ALL
SELECT main_category_id, 'Surveys', 'Employee surveys and feedback', 'low', 360
FROM category_mappings WHERE category_name = 'Events & Community'
UNION ALL
SELECT main_category_id, 'Community activities', 'Employee engagement activities', 'low', 480
FROM category_mappings WHERE category_name = 'Events & Community'
UNION ALL
SELECT main_category_id, 'Announcements', 'Company communications and notices', 'low', 120
FROM category_mappings WHERE category_name = 'Events & Community'

-- Other / General
UNION ALL
SELECT main_category_id, 'Not listed (describe below)', 'Issue not covered by other categories', 'medium', 240
FROM category_mappings WHERE category_name = 'Other / General'
UNION ALL
SELECT main_category_id, 'General inquiry', 'General questions or requests', 'low', 120
FROM category_mappings WHERE category_name = 'Other / General'
UNION ALL
SELECT main_category_id, 'Miscellaneous', 'Other unclassified issues', 'medium', 180
FROM category_mappings WHERE category_name = 'Other / General'

ON CONFLICT (main_category_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  priority = EXCLUDED.priority,
  estimated_resolution_minutes = EXCLUDED.estimated_resolution_minutes;