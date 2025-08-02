-- Phase 1: Database Schema Complete Overhaul
-- Create the new hierarchical taxonomy structure

-- Create main categories table (16 categories from the taxonomy)
CREATE TABLE IF NOT EXISTS public.main_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sub-categories table with specific issues
CREATE TABLE IF NOT EXISTS public.sub_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  main_category_id UUID NOT NULL REFERENCES public.main_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_priority TEXT DEFAULT 'medium',
  estimated_resolution_minutes INTEGER DEFAULT 480,
  response_sla_minutes INTEGER DEFAULT 60,
  resolution_sla_minutes INTEGER DEFAULT 480,
  auto_escalate BOOLEAN DEFAULT false,
  escalation_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create building areas table
CREATE TABLE IF NOT EXISTS public.building_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  zone_type TEXT DEFAULT 'general',
  coordinates JSONB, -- For geo-fencing
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create building floors table
CREATE TABLE IF NOT EXISTS public.building_floors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  floor_number INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create advanced SLA configurations
CREATE TABLE IF NOT EXISTS public.sla_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  main_category_id UUID REFERENCES public.main_categories(id),
  sub_category_id UUID REFERENCES public.sub_categories(id),
  priority TEXT NOT NULL,
  response_sla_minutes INTEGER NOT NULL,
  resolution_sla_minutes INTEGER NOT NULL,
  escalation_rules JSONB DEFAULT '[]',
  auto_escalate BOOLEAN DEFAULT false,
  escalation_minutes INTEGER,
  exclude_hours JSONB DEFAULT '[]', -- Maintenance windows
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update maintenance_requests table to use new structure
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS main_category_id UUID REFERENCES public.main_categories(id),
ADD COLUMN IF NOT EXISTS sub_category_id UUID REFERENCES public.sub_categories(id),
ADD COLUMN IF NOT EXISTS building_area_id UUID REFERENCES public.building_areas(id),
ADD COLUMN IF NOT EXISTS building_floor_id UUID REFERENCES public.building_floors(id),
ADD COLUMN IF NOT EXISTS response_sla_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resolution_sla_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS gps_coordinates JSONB,
ADD COLUMN IF NOT EXISTS auto_detected_location BOOLEAN DEFAULT false;

-- Insert the 16 main categories from the taxonomy
INSERT INTO public.main_categories (name, description, icon, sort_order) VALUES
('Workstation & Furniture', 'Chair, desk, locker and seating issues', 'Chair', 1),
('Electrical & Lighting', 'Power, socket, lighting and UPS issues', 'Zap', 2),
('HVAC & Air Quality', 'Temperature, AC, and air quality issues', 'Wind', 3),
('Plumbing & Washrooms', 'Water, taps, flush and hygiene issues', 'Droplets', 4),
('Housekeeping & Cleaning', 'Cleaning, dusting and sanitization requests', 'Sparkles', 5),
('Pantry & F&B', 'Beverage machines, stock and vendor issues', 'Coffee', 6),
('Security & Access Control', 'ID cards, turnstiles and security issues', 'Shield', 7),
('IT & Connectivity', 'Network, Wi-Fi, and printer issues', 'Wifi', 8),
('AV & Meeting Rooms', 'Display, video conferencing and booking issues', 'Monitor', 9),
('Lifts & Vertical Transport', 'Elevator and lift-related issues', 'MoveVertical', 10),
('Building Services', 'Structural, ceiling and painting issues', 'Building', 11),
('Environment & Sustainability', 'Waste, recycling and energy issues', 'Leaf', 12),
('Health & Safety', 'First aid, fire alarms and PPE requests', 'Heart', 13),
('Business Support & Admin', 'Courier, stationery and visitor support', 'FileText', 14),
('Events & Community', 'Space booking, events and feedback', 'Calendar', 15),
('Other / General', 'Issues not covered elsewhere', 'HelpCircle', 16);

-- Insert sample sub-categories for key categories
INSERT INTO public.sub_categories (main_category_id, name, default_priority, response_sla_minutes, resolution_sla_minutes) 
SELECT id, 'Chair broken', 'medium', 60, 480 FROM public.main_categories WHERE name = 'Workstation & Furniture'
UNION ALL
SELECT id, 'Height-adjustment fault', 'medium', 60, 480 FROM public.main_categories WHERE name = 'Workstation & Furniture'
UNION ALL
SELECT id, 'Locker key issue', 'low', 240, 2880 FROM public.main_categories WHERE name = 'Workstation & Furniture'
UNION ALL
SELECT id, 'New seating request', 'low', 240, 2880 FROM public.main_categories WHERE name = 'Workstation & Furniture'
UNION ALL
SELECT id, 'Power outage', 'critical', 5, 120 FROM public.main_categories WHERE name = 'Electrical & Lighting'
UNION ALL
SELECT id, 'Socket sparking', 'critical', 5, 120 FROM public.main_categories WHERE name = 'Electrical & Lighting'
UNION ALL
SELECT id, 'Bulb / tube replacement', 'medium', 60, 480 FROM public.main_categories WHERE name = 'Electrical & Lighting'
UNION ALL
SELECT id, 'UPS alert', 'high', 15, 240 FROM public.main_categories WHERE name = 'Electrical & Lighting'
UNION ALL
SELECT id, 'Zone temperature high/low', 'high', 15, 240 FROM public.main_categories WHERE name = 'HVAC & Air Quality'
UNION ALL
SELECT id, 'AC water leak', 'high', 15, 240 FROM public.main_categories WHERE name = 'HVAC & Air Quality'
UNION ALL
SELECT id, 'Air-quality alert (PM2.5, CO₂)', 'medium', 60, 480 FROM public.main_categories WHERE name = 'HVAC & Air Quality'
UNION ALL
SELECT id, 'Lift stuck', 'critical', 5, 120 FROM public.main_categories WHERE name = 'Lifts & Vertical Transport'
UNION ALL
SELECT id, 'Overload alarm', 'high', 15, 240 FROM public.main_categories WHERE name = 'Lifts & Vertical Transport'
UNION ALL
SELECT id, 'Call-button fault', 'medium', 60, 480 FROM public.main_categories WHERE name = 'Lifts & Vertical Transport';

-- Insert common building areas
INSERT INTO public.building_areas (name, description, zone_type, sort_order) VALUES
('Reception', 'Main reception and lobby area', 'public', 1),
('Cafeteria', 'Dining and food service area', 'public', 2),
('Meeting Rooms', 'Conference and meeting spaces', 'meeting', 3),
('Workstations', 'General office workspaces', 'workspace', 4),
('Washrooms', 'Restroom facilities', 'facility', 5),
('Pantry', 'Kitchen and beverage areas', 'facility', 6),
('Server Room', 'IT infrastructure space', 'technical', 7),
('Storage', 'Storage and utility areas', 'utility', 8),
('Parking', 'Vehicle parking areas', 'external', 9),
('Terrace', 'Outdoor terrace spaces', 'external', 10);

-- Insert building floors
INSERT INTO public.building_floors (name, floor_number, sort_order) VALUES
('Basement', -1, 1),
('Ground Floor', 0, 2),
('1st Floor', 1, 3),
('2nd Floor', 2, 4),
('3rd Floor', 3, 5),
('4th Floor', 4, 6),
('5th Floor', 5, 7),
('6th Floor', 6, 8),
('7th Floor', 7, 9),
('8th Floor', 8, 10),
('9th Floor', 9, 11),
('10th Floor', 10, 12);

-- Insert SLA configurations based on the priority matrix
INSERT INTO public.sla_configurations (main_category_id, sub_category_id, priority, response_sla_minutes, resolution_sla_minutes, auto_escalate, escalation_minutes) VALUES
-- Critical Priority (P1)
(NULL, NULL, 'critical', 5, 120, true, 90),
-- High Priority (P2)  
(NULL, NULL, 'high', 15, 240, true, 180),
-- Medium Priority (P3)
(NULL, NULL, 'medium', 60, 480, false, NULL),
-- Low Priority (P4)
(NULL, NULL, 'low', 240, 2880, false, NULL);

-- Enable RLS for new tables
ALTER TABLE public.main_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view main categories" ON public.main_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage main categories" ON public.main_categories FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Anyone can view sub categories" ON public.sub_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage sub categories" ON public.sub_categories FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Anyone can view building areas" ON public.building_areas FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage building areas" ON public.building_areas FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Anyone can view building floors" ON public.building_floors FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage building floors" ON public.building_floors FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view SLA configurations" ON public.sla_configurations FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage SLA configurations" ON public.sla_configurations FOR ALL USING (is_admin(auth.uid()));

-- Create function to calculate SLA deadlines
CREATE OR REPLACE FUNCTION public.calculate_request_sla()
RETURNS TRIGGER AS $$
DECLARE
  sla_config RECORD;
  response_minutes INTEGER;
  resolution_minutes INTEGER;
BEGIN
  -- Get SLA configuration for this request
  SELECT * INTO sla_config
  FROM public.sla_configurations
  WHERE (main_category_id = NEW.main_category_id OR main_category_id IS NULL)
    AND (sub_category_id = NEW.sub_category_id OR sub_category_id IS NULL)
    AND priority = NEW.priority
    AND is_active = true
  ORDER BY sub_category_id NULLS LAST, main_category_id NULLS LAST
  LIMIT 1;
  
  IF FOUND THEN
    response_minutes := sla_config.response_sla_minutes;
    resolution_minutes := sla_config.resolution_sla_minutes;
  ELSE
    -- Fallback to default SLA based on priority
    CASE NEW.priority
      WHEN 'critical' THEN response_minutes := 5; resolution_minutes := 120;
      WHEN 'high' THEN response_minutes := 15; resolution_minutes := 240;
      WHEN 'medium' THEN response_minutes := 60; resolution_minutes := 480;
      WHEN 'low' THEN response_minutes := 240; resolution_minutes := 2880;
      ELSE response_minutes := 60; resolution_minutes := 480;
    END CASE;
  END IF;
  
  -- Set SLA deadlines
  NEW.response_sla_at := NOW() + (response_minutes * INTERVAL '1 minute');
  NEW.resolution_sla_at := NOW() + (resolution_minutes * INTERVAL '1 minute');
  NEW.sla_breach_at := NEW.resolution_sla_at; -- Keep existing field for compatibility
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for SLA calculation
DROP TRIGGER IF EXISTS calculate_request_sla_trigger ON public.maintenance_requests;
CREATE TRIGGER calculate_request_sla_trigger
  BEFORE INSERT OR UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_request_sla();