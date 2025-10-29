-- =====================================================
-- Phase 1: Seed Critical Empty Tables with Initial Data
-- Populating 10 most-queried empty tables to reduce wasted queries
-- Using actual table schemas
-- =====================================================

-- 1. Seed main_categories (3,867 queries, 0 rows) - CRITICAL
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.main_categories LIMIT 1) THEN
    INSERT INTO public.main_categories (name, icon, description, color, sort_order, is_active) VALUES
      ('Electrical', '⚡', 'Electrical systems and lighting', '#FFB800', 1, true),
      ('Plumbing', '🚰', 'Water, drainage, and plumbing fixtures', '#4A90E2', 2, true),
      ('HVAC', '❄️', 'Heating, ventilation, and air conditioning', '#50E3C2', 3, true),
      ('Structural', '🏗️', 'Building structure and walls', '#B8B8B8', 4, true),
      ('Security', '🔒', 'Security systems and access control', '#E74C3C', 5, true),
      ('Cleaning', '🧹', 'Cleaning and housekeeping', '#9B59B6', 6, true),
      ('Landscaping', '🌳', 'Outdoor maintenance and gardening', '#27AE60', 7, true),
      ('IT/Technology', '💻', 'Technology and network infrastructure', '#3498DB', 8, true),
      ('Safety', '⚠️', 'Safety equipment and emergency systems', '#F39C12', 9, true),
      ('General Maintenance', '🔧', 'General repairs and maintenance', '#95A5A6', 10, true);
  END IF;
END $$;

-- 2. Seed sub_categories (1,622 queries, 0 rows)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.sub_categories LIMIT 1) THEN
    INSERT INTO public.sub_categories (name, main_category_id, description) 
    SELECT 'Light Fixture Repair', id, 'Fix or replace light fixtures' FROM public.main_categories WHERE name = 'Electrical'
    UNION ALL
    SELECT 'Outlet/Switch Issues', id, 'Repair electrical outlets or switches' FROM public.main_categories WHERE name = 'Electrical'
    UNION ALL
    SELECT 'Leak Repair', id, 'Fix water leaks' FROM public.main_categories WHERE name = 'Plumbing'
    UNION ALL
    SELECT 'Drain Cleaning', id, 'Clear clogged drains' FROM public.main_categories WHERE name = 'Plumbing'
    UNION ALL
    SELECT 'AC Maintenance', id, 'Air conditioning service' FROM public.main_categories WHERE name = 'HVAC'
    UNION ALL
    SELECT 'Heating Issues', id, 'Heating system repairs' FROM public.main_categories WHERE name = 'HVAC'
    UNION ALL
    SELECT 'Wall Damage', id, 'Repair holes or cracks in walls' FROM public.main_categories WHERE name = 'Structural'
    UNION ALL
    SELECT 'Door/Window Repair', id, 'Fix doors or windows' FROM public.main_categories WHERE name = 'Structural'
    UNION ALL
    SELECT 'Lock Replacement', id, 'Replace or repair locks' FROM public.main_categories WHERE name = 'Security'
    UNION ALL
    SELECT 'Camera Issues', id, 'Security camera maintenance' FROM public.main_categories WHERE name = 'Security';
  END IF;
END $$;

-- 3. Seed maintenance_categories (1,800 queries, 0 rows) - Legacy structure
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.maintenance_categories LIMIT 1) THEN
    INSERT INTO public.maintenance_categories (name, description, icon, sort_order, is_active, estimated_resolution_minutes) VALUES
      ('Electrical', 'Electrical systems and lighting', '⚡', 1, true, 120),
      ('Plumbing', 'Water and drainage systems', '🚰', 2, true, 90),
      ('HVAC', 'Climate control systems', '❄️', 3, true, 180),
      ('Structural', 'Building structure', '🏗️', 4, true, 240),
      ('Security', 'Security and access systems', '🔒', 5, true, 60),
      ('General', 'General maintenance tasks', '🔧', 6, true, 60);
  END IF;
END $$;

-- 4. Seed departments (545 queries, 0 rows)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.departments LIMIT 1) THEN
    INSERT INTO public.departments (name, description, is_active) VALUES
      ('Maintenance', 'Facilities maintenance and repairs', true),
      ('Housekeeping', 'Cleaning and housekeeping services', true),
      ('Security', 'Security and safety operations', true),
      ('Administration', 'Administrative operations', true),
      ('IT Support', 'Information technology support', true),
      ('Property Management', 'Property and tenant management', true);
  END IF;
END $$;

-- 5. Seed building_areas (491 queries, 0 rows)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.building_areas LIMIT 1) THEN
    INSERT INTO public.building_areas (name, description, zone_type, is_active, sort_order) VALUES
      ('Main Lobby', 'Primary building entrance and reception', 'public', true, 1),
      ('North Wing', 'Northern section of the building', 'restricted', true, 2),
      ('South Wing', 'Southern section of the building', 'restricted', true, 3),
      ('East Wing', 'Eastern section of the building', 'restricted', true, 4),
      ('Parking Garage', 'Underground parking facility', 'public', true, 5),
      ('Rooftop', 'Rooftop area and equipment', 'maintenance', true, 6),
      ('Common Areas', 'Shared spaces and corridors', 'public', true, 7),
      ('Basement', 'Lower level utilities and storage', 'maintenance', true, 8);
  END IF;
END $$;

-- 6. Seed rooms (3,590 queries, 0 rows)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.rooms LIMIT 1) THEN
    INSERT INTO public.rooms (name, description, capacity, location, facilities) VALUES
      ('Conference Room A', 'Large conference room with AV equipment', 12, 'Main Lobby', ARRAY['Projector', 'Whiteboard', 'Video Conference']),
      ('Conference Room B', 'Medium-sized meeting space', 8, 'North Wing', ARRAY['TV Screen', 'Whiteboard']),
      ('Training Room', 'Classroom-style training facility', 20, 'South Wing', ARRAY['Projector', 'Sound System', 'Whiteboard']),
      ('Board Room', 'Executive meeting room', 16, 'East Wing', ARRAY['Video Conference', 'Premium AV', 'Catering Setup']),
      ('Break Room North', 'Employee break area', 10, 'North Wing', ARRAY['Coffee Machine', 'Microwave', 'Refrigerator']),
      ('Break Room South', 'Employee break area', 10, 'South Wing', ARRAY['Coffee Machine', 'Microwave', 'Refrigerator']);
  END IF;
END $$;

-- 7. Seed alerts (7,436 queries, 0 rows) - System alerts  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.alerts LIMIT 1) THEN
    INSERT INTO public.alerts (title, message, severity, is_active, expires_at) VALUES
      ('Welcome to the System', 'System is operational and ready for use', 'info', true, NOW() + INTERVAL '30 days'),
      ('Maintenance Schedule', 'Regular maintenance scheduled for this weekend', 'info', true, NOW() + INTERVAL '7 days'),
      ('Security Update', 'Security systems updated successfully', 'info', false, NOW() - INTERVAL '1 day');
  END IF;
END $$;

-- 8. Seed visitors (4,338 queries, 0 rows) - Visitor examples
-- Note: Requires a valid host_id (user), so we'll create placeholder entries
DO $$
DECLARE
  first_user_id uuid;
BEGIN
  -- Get first user id from profiles table
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;
  
  -- Only insert if we have a valid user
  IF first_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.visitors LIMIT 1) THEN
    INSERT INTO public.visitors (name, company, visit_purpose, host_id, visit_date, status, approval_status) VALUES
      ('Guest User', 'Demo Company', 'Facility Tour', first_user_id, CURRENT_DATE - 1, 'completed', 'approved'),
      ('Contractor Demo', 'Maintenance Corp', 'Facility Assessment', first_user_id, CURRENT_DATE - 2, 'completed', 'approved');
  END IF;
END $$;

-- 9. Seed room_bookings (5,203 queries, 0 rows) - Sample bookings
DO $$
DECLARE
  first_room_id uuid;
  first_user_id uuid;
BEGIN
  -- Get first room and user
  SELECT id INTO first_room_id FROM public.rooms LIMIT 1;
  SELECT id INTO first_user_id FROM auth.users LIMIT 1;
  
  -- Only insert if we have valid references
  IF first_room_id IS NOT NULL AND first_user_id IS NOT NULL 
     AND NOT EXISTS (SELECT 1 FROM public.room_bookings LIMIT 1) THEN
    INSERT INTO public.room_bookings (room_id, user_id, title, description, start_time, end_time, status, duration_minutes) VALUES
      (first_room_id, first_user_id, 'System Test Booking', 'Initial test booking', 
       NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week' + INTERVAL '1 hour', 
       'completed', 60);
  END IF;
END $$;

-- 10. Seed category_group_mappings (1,404 queries, 0 rows)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.category_group_mappings LIMIT 1) THEN
    -- Map main categories to maintenance categories
    INSERT INTO public.category_group_mappings (category_id, group_id)
    SELECT mc.id, mtc.id
    FROM public.main_categories mc
    JOIN public.maintenance_categories mtc ON mc.name = mtc.name
    WHERE mc.name IN ('Electrical', 'Plumbing', 'HVAC', 'Structural', 'Security');
  END IF;
END $$;

-- Create indexes for better query performance on newly populated tables
CREATE INDEX IF NOT EXISTS idx_main_categories_name ON public.main_categories(name);
CREATE INDEX IF NOT EXISTS idx_main_categories_active ON public.main_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sub_categories_main_category ON public.sub_categories(main_category_id);
CREATE INDEX IF NOT EXISTS idx_rooms_location ON public.rooms(location);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON public.alerts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_room_bookings_status_time ON public.room_bookings(status, start_time);
CREATE INDEX IF NOT EXISTS idx_visitors_status ON public.visitors(status, visit_date);
CREATE INDEX IF NOT EXISTS idx_building_areas_active ON public.building_areas(is_active) WHERE is_active = true;

-- Add helpful comments
COMMENT ON TABLE public.main_categories IS 'Seeded with 10 standard maintenance categories - Phase 1 optimization';
COMMENT ON TABLE public.departments IS 'Seeded with 6 standard departments - Phase 1 optimization';
COMMENT ON TABLE public.building_areas IS 'Seeded with 8 standard building areas - Phase 1 optimization';
COMMENT ON TABLE public.rooms IS 'Seeded with 6 meeting and break rooms - Phase 1 optimization';