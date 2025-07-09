-- Populate rooms for booking system
INSERT INTO rooms (name, description, location, capacity, facilities, image_url) VALUES
  ('Conference Room A', 'Large conference room with video conferencing capability', '3rd Floor - East Wing', 12, ARRAY['Projector', 'Video Conference', 'Whiteboard', 'WiFi', 'AC'], '/placeholder.svg'),
  ('Conference Room B', 'Medium conference room perfect for team meetings', '3rd Floor - West Wing', 8, ARRAY['Smart TV', 'Whiteboard', 'WiFi', 'AC'], '/placeholder.svg'),
  ('Meeting Room 1', 'Small meeting room for quick discussions', '2nd Floor - North', 4, ARRAY['TV Screen', 'WiFi', 'AC'], '/placeholder.svg'),
  ('Meeting Room 2', 'Small meeting room with natural lighting', '2nd Floor - South', 4, ARRAY['TV Screen', 'WiFi', 'AC', 'Natural Light'], '/placeholder.svg'),
  ('Training Room', 'Large training room with presentation setup', '4th Floor - Center', 20, ARRAY['Projector', 'Sound System', 'Whiteboard', 'WiFi', 'AC', 'Tables'], '/placeholder.svg'),
  ('Boardroom', 'Executive boardroom for important meetings', '5th Floor - Executive', 16, ARRAY['Premium AV Setup', 'Video Conference', 'Executive Furniture', 'WiFi', 'AC'], '/placeholder.svg');

-- Populate service categories
INSERT INTO service_categories (name, description, icon) VALUES
  ('Housekeeping', 'Cleaning and maintenance services', 'sparkles'),
  ('Catering', 'Food and beverage services', 'utensils'),
  ('IT Support', 'Technical assistance and equipment', 'monitor'),
  ('Transportation', 'Vehicle and logistics services', 'car'),
  ('Event Support', 'Setup and coordination for events', 'calendar'),
  ('Security Services', 'Additional security requirements', 'shield');

-- Populate visitor categories
INSERT INTO visitor_categories (name, description, icon, color) VALUES
  ('Business Meeting', 'Corporate meetings and consultations', 'briefcase', '#3B82F6'),
  ('Vendor/Supplier', 'Service providers and suppliers', 'truck', '#10B981'),
  ('Interview Candidate', 'Job interviews and assessments', 'user-check', '#8B5CF6'),
  ('Delivery Personnel', 'Package and document deliveries', 'package', '#F59E0B'),
  ('Maintenance Worker', 'External maintenance and repair services', 'wrench', '#EF4444'),
  ('VIP Guest', 'Important visitors and executives', 'crown', '#EC4899');

-- Populate content categories for info hub
INSERT INTO content_categories (name, description, icon, display_order) VALUES
  ('Building Guidelines', 'Rules, policies and procedures', 'book-open', 1),
  ('Emergency Procedures', 'Safety and emergency information', 'alert-triangle', 2),
  ('Floor Plans', 'Building maps and navigation', 'map', 3),
  ('Directory', 'Contact information and office locations', 'phone', 4),
  ('Amenities', 'Facilities and services available', 'star', 5),
  ('Events & Updates', 'News and upcoming events', 'calendar', 6);

-- Populate knowledge base articles
INSERT INTO knowledge_base_articles (
  title, content, category, difficulty, estimated_time_minutes, 
  required_tools, safety_warnings, steps, tags
) VALUES
  (
    'Reset WiFi Password',
    'Instructions for resetting your office WiFi password when you are locked out.',
    'IT Support',
    'easy',
    5,
    ARRAY['Computer or Phone'],
    ARRAY['Ensure you have admin credentials'],
    '[
      {"step": 1, "description": "Navigate to WiFi settings on your device"},
      {"step": 2, "description": "Select Forget on the SS Plaza network"},
      {"step": 3, "description": "Contact IT support at ext. 2020 for new password"},
      {"step": 4, "description": "Reconnect using the new credentials"}
    ]'::jsonb,
    ARRAY['wifi', 'password', 'network', 'it-support']
  ),
  (
    'Replace Printer Toner',
    'Step-by-step guide to replace toner cartridge in office printers.',
    'General Maintenance',
    'medium',
    10,
    ARRAY['New Toner Cartridge', 'Gloves'],
    ARRAY['Handle toner carefully to avoid spills', 'Wear gloves to prevent ink stains'],
    '[
      {"step": 1, "description": "Turn off the printer and open the front cover"},
      {"step": 2, "description": "Remove the old toner cartridge carefully"},
      {"step": 3, "description": "Unpack the new cartridge and remove protective tape"},
      {"step": 4, "description": "Insert the new cartridge until it clicks"},
      {"step": 5, "description": "Close the cover and turn on the printer"}
    ]'::jsonb,
    ARRAY['printer', 'toner', 'maintenance', 'office-equipment']
  ),
  (
    'Fix Jammed Paper Shredder',
    'How to safely clear paper jams in office shredders.',
    'General Maintenance', 
    'medium',
    8,
    ARRAY['Screwdriver', 'Tweezers'],
    ARRAY['Always unplug shredder before maintenance', 'Never put fingers near cutting blades'],
    '[
      {"step": 1, "description": "Unplug the shredder from power source"},
      {"step": 2, "description": "Remove the waste basket"},
      {"step": 3, "description": "Use tweezers to carefully remove jammed paper"},
      {"step": 4, "description": "Check for any remaining paper fragments"},
      {"step": 5, "description": "Reassemble and test with a single sheet"}
    ]'::jsonb,
    ARRAY['shredder', 'paper-jam', 'office-equipment']
  );

-- Populate cafeteria menu categories
INSERT INTO cafeteria_menu_categories (name, description, image_url) VALUES
  ('Breakfast', 'Start your day with our fresh breakfast options', '/placeholder.svg'),
  ('Lunch Specials', 'Daily lunch specials and main courses', '/placeholder.svg'),
  ('Snacks', 'Light bites and quick snacks', '/placeholder.svg'),
  ('Beverages', 'Hot and cold drinks', '/placeholder.svg'),
  ('Desserts', 'Sweet treats and desserts', '/placeholder.svg');

-- Populate cafeteria menu items
INSERT INTO cafeteria_menu_items (
  name, description, price, category_id, is_vegetarian, is_vegan, is_available
) VALUES
  ('Continental Breakfast', 'Croissant, jam, butter, fresh fruit, coffee/tea', 8.50, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Breakfast' LIMIT 1), true, false, true),
  ('Eggs Benedict', 'Poached eggs, hollandaise sauce, english muffin, hash browns', 12.00, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Breakfast' LIMIT 1), true, false, true),
  ('Grilled Chicken Salad', 'Mixed greens, grilled chicken, cherry tomatoes, balsamic dressing', 11.50, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Lunch Specials' LIMIT 1), false, false, true),
  ('Vegetarian Pasta', 'Penne pasta with seasonal vegetables and marinara sauce', 10.00, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Lunch Specials' LIMIT 1), true, true, true),
  ('Sandwich Combo', 'Choice of sandwich with chips and pickle', 9.75, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Lunch Specials' LIMIT 1), true, false, true),
  ('Fresh Fruit Bowl', 'Seasonal mixed fruit bowl', 4.50, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Snacks' LIMIT 1), true, true, true),
  ('Coffee', 'Freshly brewed regular or decaf', 2.50, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Beverages' LIMIT 1), true, true, true),
  ('Cappuccino', 'Espresso with steamed milk and foam', 3.75, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Beverages' LIMIT 1), true, false, true),
  ('Chocolate Cake', 'Rich chocolate layer cake', 4.25, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Desserts' LIMIT 1), true, false, true);