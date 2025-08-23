-- Simple insert for categories and sub-categories
-- First, insert the main categories
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
ON CONFLICT (name) DO NOTHING;

-- Delete existing sub-categories to avoid conflicts
DELETE FROM sub_categories;

-- Now insert sub-categories for each category
-- Get category IDs and insert sub-categories
DO $$
DECLARE
    cat_id UUID;
BEGIN
    -- Workstation & Furniture
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Workstation & Furniture';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Chair broken', 'Broken or damaged office chair', 'medium', 120),
    (cat_id, 'Desk alignment', 'Desk positioning or height adjustment', 'low', 60),
    (cat_id, 'Locker not opening', 'Personal locker access issues', 'medium', 90),
    (cat_id, 'Furniture damage', 'General furniture repair or replacement', 'medium', 180),
    (cat_id, 'Ergonomic adjustment', 'Workstation ergonomic setup', 'low', 45);

    -- Electrical & Lighting
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Electrical & Lighting';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Power outage', 'Electrical power interruption', 'urgent', 30),
    (cat_id, 'Socket fault', 'Electrical outlet not working', 'high', 90),
    (cat_id, 'UPS failure', 'Uninterruptible power supply issues', 'urgent', 60),
    (cat_id, 'Light not working', 'Lighting fixtures or bulbs', 'medium', 60),
    (cat_id, 'Circuit breaker trip', 'Electrical circuit protection issues', 'high', 45);

    -- HVAC & Air Quality
    SELECT id INTO cat_id FROM main_categories WHERE name = 'HVAC & Air Quality';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'AC breakdown (bay)', 'Air conditioning unit failure', 'urgent', 120),
    (cat_id, 'Uneven cooling', 'Temperature variation across areas', 'medium', 180),
    (cat_id, 'Filter cleaning', 'HVAC filter maintenance', 'low', 90),
    (cat_id, 'Ventilation issues', 'Poor air circulation or quality', 'medium', 120),
    (cat_id, 'Thermostat malfunction', 'Temperature control not working', 'medium', 60);

    -- Plumbing & Washrooms
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Plumbing & Washrooms';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Flush not working', 'Toilet flush mechanism failure', 'high', 90),
    (cat_id, 'Tap leakage', 'Water tap or faucet leaking', 'medium', 60),
    (cat_id, 'No water supply', 'Complete water supply interruption', 'urgent', 60),
    (cat_id, 'Washroom maintenance', 'General washroom repairs', 'medium', 120),
    (cat_id, 'Drainage blockage', 'Blocked drains or sewage', 'high', 120);

    -- Housekeeping & Cleaning
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Housekeeping & Cleaning';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Daily cleaning', 'Regular cleaning services', 'low', 180),
    (cat_id, 'Dusting', 'Dust removal and surface cleaning', 'low', 120),
    (cat_id, 'Deep cleaning', 'Thorough cleaning of areas', 'low', 360),
    (cat_id, 'Pest control', 'Pest management and extermination', 'medium', 240),
    (cat_id, 'Waste management', 'Garbage collection and disposal', 'medium', 90);

    -- Pantry & F&B
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Pantry & F&B';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Coffee machine down', 'Coffee maker not functioning', 'medium', 120),
    (cat_id, 'Stock shortage', 'Pantry supplies running low', 'low', 480),
    (cat_id, 'Vendor delay', 'Food service vendor issues', 'medium', 240),
    (cat_id, 'Appliance maintenance', 'Kitchen appliance repairs', 'medium', 180),
    (cat_id, 'Hygiene concerns', 'Food safety and cleanliness', 'high', 90);

    -- Security & Access Control
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Security & Access Control';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'ID card issues', 'Access card not working', 'high', 60),
    (cat_id, 'Turnstile not working', 'Entry gate malfunction', 'high', 90),
    (cat_id, 'CCTV fault', 'Security camera not functioning', 'high', 120),
    (cat_id, 'Door lock malfunction', 'Electronic door lock issues', 'high', 90),
    (cat_id, 'Visitor access', 'Guest entry and escort issues', 'medium', 45);

    -- IT & Connectivity
    SELECT id INTO cat_id FROM main_categories WHERE name = 'IT & Connectivity';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Wi-Fi down', 'Wireless network connectivity issues', 'high', 90),
    (cat_id, 'Printer error', 'Printer malfunction or setup', 'medium', 60),
    (cat_id, 'LAN port dead', 'Ethernet connection not working', 'medium', 90),
    (cat_id, 'Network slowdown', 'Slow internet or network performance', 'medium', 120),
    (cat_id, 'Software issues', 'Application or system software problems', 'medium', 180);

    -- AV & Meeting Rooms
    SELECT id INTO cat_id FROM main_categories WHERE name = 'AV & Meeting Rooms';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'VC not connecting', 'Video conferencing setup issues', 'high', 90),
    (cat_id, 'Display not working', 'Projector or screen malfunction', 'high', 60),
    (cat_id, 'Booking issue', 'Room reservation problems', 'medium', 30),
    (cat_id, 'Audio problems', 'Sound system or microphone issues', 'medium', 60),
    (cat_id, 'Remote control missing', 'AV equipment remote not available', 'low', 30);

    -- Lifts & Vertical Transport
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Lifts & Vertical Transport';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Lift breakdown', 'Elevator completely out of service', 'urgent', 60),
    (cat_id, 'Stuck lift', 'People trapped in elevator', 'urgent', 15),
    (cat_id, 'Call button not working', 'Elevator call button malfunction', 'high', 60),
    (cat_id, 'Door issues', 'Elevator door not opening/closing properly', 'high', 90),
    (cat_id, 'Unusual noise', 'Elevator making strange sounds', 'medium', 120);

    -- Building Services
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Building Services';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Ceiling tile damage', 'Damaged or missing ceiling tiles', 'medium', 180),
    (cat_id, 'Wall painting', 'Wall maintenance and painting', 'low', 480),
    (cat_id, 'Glass crack', 'Broken or cracked windows/glass', 'high', 240),
    (cat_id, 'Flooring issues', 'Floor damage or maintenance', 'medium', 360),
    (cat_id, 'Structural repairs', 'Building structural maintenance', 'high', 720);

    -- Environment & Sustainability
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Environment & Sustainability';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Waste segregation', 'Proper waste sorting and disposal', 'medium', 120),
    (cat_id, 'Recycling', 'Recycling program and bins', 'low', 180),
    (cat_id, 'Solar / energy issues', 'Renewable energy system problems', 'medium', 240),
    (cat_id, 'Energy efficiency', 'Power saving and efficiency measures', 'low', 360),
    (cat_id, 'Environmental compliance', 'Environmental regulations and reporting', 'medium', 480);

    -- Health & Safety
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Health & Safety';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Fire alarm', 'Fire alarm system issues', 'urgent', 30),
    (cat_id, 'First aid', 'Medical emergency or first aid needs', 'urgent', 15),
    (cat_id, 'PPE', 'Personal protective equipment requirements', 'medium', 240),
    (cat_id, 'Fire drills', 'Emergency evacuation procedures', 'medium', 180),
    (cat_id, 'Safety compliance', 'Workplace safety regulations', 'high', 360);

    -- Business Support & Admin
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Business Support & Admin';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Courier', 'Package delivery and mail services', 'low', 120),
    (cat_id, 'Stationery', 'Office supplies and stationery', 'low', 240),
    (cat_id, 'Visitor support', 'Guest services and visitor assistance', 'medium', 60),
    (cat_id, 'Documentation', 'Administrative paperwork and forms', 'low', 180),
    (cat_id, 'Reception services', 'Front desk and reception support', 'medium', 90);

    -- Events & Community
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Events & Community';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Space booking', 'Event space reservation', 'medium', 60),
    (cat_id, 'Event support', 'Event setup and coordination', 'medium', 240),
    (cat_id, 'Surveys', 'Employee surveys and feedback', 'low', 360),
    (cat_id, 'Community activities', 'Employee engagement activities', 'low', 480),
    (cat_id, 'Announcements', 'Company communications and notices', 'low', 120);

    -- Other / General
    SELECT id INTO cat_id FROM main_categories WHERE name = 'Other / General';
    INSERT INTO sub_categories (main_category_id, name, description, priority, estimated_resolution_minutes) VALUES
    (cat_id, 'Not listed (describe below)', 'Issue not covered by other categories', 'medium', 240),
    (cat_id, 'General inquiry', 'General questions or requests', 'low', 120),
    (cat_id, 'Miscellaneous', 'Other unclassified issues', 'medium', 180);
END $$;