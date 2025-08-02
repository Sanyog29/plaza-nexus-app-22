-- Update access_points table structure to match our needs
ALTER TABLE public.access_points 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_level_required TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS emergency_override BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS maintenance_due DATE,
ADD COLUMN IF NOT EXISTS installation_date DATE,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS vendor TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS signal_strength INTEGER CHECK (signal_strength BETWEEN 0 AND 100);

-- Rename device_type to type for consistency
ALTER TABLE public.access_points 
RENAME COLUMN device_type TO type;

-- Update last_ping to last_activity for consistency  
ALTER TABLE public.access_points 
RENAME COLUMN last_ping TO last_activity;

-- Update security_systems table structure
ALTER TABLE public.security_systems
ADD COLUMN IF NOT EXISTS alerts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uptime_percentage DECIMAL(5,2) DEFAULT 99.0,
ADD COLUMN IF NOT EXISTS last_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_maintenance DATE,
ADD COLUMN IF NOT EXISTS vendor TEXT,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS serial_number TEXT,
ADD COLUMN IF NOT EXISTS installation_date DATE,
ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS firmware_version TEXT;

-- Insert sample data for access_points (only if empty)
INSERT INTO public.access_points (name, type, location, floor, zone, status, is_locked, last_activity, access_level_required)
SELECT * FROM (VALUES
  ('Main Entrance', 'door', 'Lobby', 'Ground', 'A', 'online', false, now() - interval '5 minutes', 'basic'),
  ('Server Room', 'door', 'IT Department', '2nd', 'B', 'online', true, now() - interval '2 hours', 'high'),
  ('Parking Gate A', 'gate', 'Parking Area A', 'Basement', 'P1', 'online', false, now() - interval '1 hour', 'basic'),
  ('Executive Floor', 'elevator', 'Executive Area', '10th', 'E', 'online', true, now() - interval '30 minutes', 'executive'),
  ('Emergency Exit B', 'door', 'East Wing', '3rd', 'C', 'online', false, now() - interval '1 day', 'emergency'),
  ('Loading Dock', 'barrier', 'Loading Area', 'Ground', 'L', 'maintenance', false, now() - interval '3 hours', 'staff'),
  ('Cafeteria Entrance', 'turnstile', 'Cafeteria', '1st', 'D', 'online', false, now() - interval '15 minutes', 'basic'),
  ('Data Center', 'door', 'Data Center', 'Basement', 'DC', 'online', true, now() - interval '6 hours', 'restricted')
) AS v(name, type, location, floor, zone, status, is_locked, last_activity, access_level_required)
WHERE NOT EXISTS (SELECT 1 FROM public.access_points WHERE name != '' LIMIT 1);

-- Insert sample data for security_systems (only if empty)
INSERT INTO public.security_systems (name, type, status, location, floor, zone, last_check, alerts_count, uptime_percentage)
SELECT * FROM (VALUES
  ('CCTV System Alpha', 'cctv', 'operational', 'All Floors', 'All', 'All', now() - interval '1 hour', 0, 99.8),
  ('Fire Detection West', 'fire_detection', 'operational', 'West Wing', 'All', 'W', now() - interval '30 minutes', 1, 99.9),
  ('Intrusion System Main', 'intrusion', 'operational', 'Perimeter', 'Ground', 'A', now() - interval '2 hours', 0, 99.5),
  ('Access Control Hub', 'access_control', 'operational', 'Security Office', 'Ground', 'S', now() - interval '5 minutes', 2, 98.9),
  ('Alarm System Floor 5', 'alarm', 'warning', '5th Floor', '5th', 'B', now() - interval '4 hours', 3, 97.2),
  ('Intercom Network', 'intercom', 'operational', 'All Locations', 'All', 'All', now() - interval '1 hour', 0, 99.7),
  ('CCTV Parking', 'cctv', 'operational', 'Parking Areas', 'Basement', 'P', now() - interval '45 minutes', 1, 99.3),
  ('Fire System East', 'fire_detection', 'critical', 'East Wing', 'All', 'E', now() - interval '6 hours', 5, 85.4)
) AS v(name, type, status, location, floor, zone, last_check, alerts_count, uptime_percentage)
WHERE NOT EXISTS (SELECT 1 FROM public.security_systems WHERE name != '' LIMIT 1);

-- Insert sample data for feature_requests (only if empty)
INSERT INTO public.feature_requests (user_id, title, description, category, priority, status, votes)
SELECT * FROM (VALUES
  ((SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 
   'Mobile Security App', 
   'Develop a mobile application for security guards to manage incidents and patrols on-the-go', 
   'mobile', 'high', 'under_review', 15),
  ((SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 
   'Facial Recognition Integration', 
   'Integrate facial recognition technology with existing CCTV systems for enhanced security monitoring', 
   'security', 'high', 'approved', 23),
  ((SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), 
   'Automated Incident Reporting', 
   'Implement AI-powered automated incident detection and reporting from security cameras', 
   'automation', 'medium', 'in_progress', 8)
) AS v(user_id, title, description, category, priority, status, votes)
WHERE NOT EXISTS (SELECT 1 FROM public.feature_requests WHERE title != '' LIMIT 1)
AND EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin');

-- Create access point control functions
CREATE OR REPLACE FUNCTION public.toggle_access_point_lock(point_id UUID, lock_state BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has permission
  IF NOT is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only staff can control access points';
  END IF;
  
  -- Update the access point
  UPDATE public.access_points 
  SET is_locked = lock_state,
      last_activity = now(),
      updated_at = now()
  WHERE id = point_id;
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(),
    CASE WHEN lock_state THEN 'lock_access_point' ELSE 'unlock_access_point' END,
    'access_point',
    point_id,
    jsonb_build_object('is_locked', lock_state, 'controlled_by', auth.uid())
  );
  
  RETURN FOUND;
END;
$$;