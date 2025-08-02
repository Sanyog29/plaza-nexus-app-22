-- Rename system_type to type in security_systems for consistency
ALTER TABLE public.security_systems 
RENAME COLUMN system_type TO type;

-- Add missing columns to security_systems
ALTER TABLE public.security_systems
ADD COLUMN IF NOT EXISTS alerts_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS uptime_percentage DECIMAL(5,2) DEFAULT 99.0,
ADD COLUMN IF NOT EXISTS next_maintenance DATE,
ADD COLUMN IF NOT EXISTS serial_number TEXT,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS firmware_version TEXT;

-- Insert sample data for access_points (only if table is currently empty or has minimal data)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.access_points) <= 1 THEN
    INSERT INTO public.access_points (name, type, location, floor, zone, status, is_locked, last_activity, access_level_required, is_active)
    VALUES
      ('Main Entrance', 'door', 'Lobby', 'Ground', 'A', 'online', false, now() - interval '5 minutes', 'basic', true),
      ('Server Room', 'door', 'IT Department', '2nd', 'B', 'online', true, now() - interval '2 hours', 'high', true),
      ('Parking Gate A', 'gate', 'Parking Area A', 'Basement', 'P1', 'online', false, now() - interval '1 hour', 'basic', true),
      ('Executive Floor', 'elevator', 'Executive Area', '10th', 'E', 'online', true, now() - interval '30 minutes', 'executive', true),
      ('Emergency Exit B', 'door', 'East Wing', '3rd', 'C', 'online', false, now() - interval '1 day', 'emergency', true),
      ('Loading Dock', 'barrier', 'Loading Area', 'Ground', 'L', 'maintenance', false, now() - interval '3 hours', 'staff', true),
      ('Cafeteria Entrance', 'turnstile', 'Cafeteria', '1st', 'D', 'online', false, now() - interval '15 minutes', 'basic', true),
      ('Data Center', 'door', 'Data Center', 'Basement', 'DC', 'online', true, now() - interval '6 hours', 'restricted', true);
  END IF;
END
$$;

-- Insert sample data for security_systems
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.security_systems) <= 1 THEN
    INSERT INTO public.security_systems (name, type, status, location, floor, zone, last_check, alerts_count, uptime_percentage, is_active)
    VALUES
      ('CCTV System Alpha', 'cctv', 'operational', 'All Floors', 'All', 'All', now() - interval '1 hour', 0, 99.8, true),
      ('Fire Detection West', 'fire_detection', 'operational', 'West Wing', 'All', 'W', now() - interval '30 minutes', 1, 99.9, true),
      ('Intrusion System Main', 'intrusion', 'operational', 'Perimeter', 'Ground', 'A', now() - interval '2 hours', 0, 99.5, true),
      ('Access Control Hub', 'access_control', 'operational', 'Security Office', 'Ground', 'S', now() - interval '5 minutes', 2, 98.9, true),
      ('Alarm System Floor 5', 'alarm', 'warning', '5th Floor', '5th', 'B', now() - interval '4 hours', 3, 97.2, true),
      ('Intercom Network', 'intercom', 'operational', 'All Locations', 'All', 'All', now() - interval '1 hour', 0, 99.7, true),
      ('CCTV Parking', 'cctv', 'operational', 'Parking Areas', 'Basement', 'P', now() - interval '45 minutes', 1, 99.3, true),
      ('Fire System East', 'fire_detection', 'critical', 'East Wing', 'All', 'E', now() - interval '6 hours', 5, 85.4, true);
  END IF;
END
$$;

-- Insert sample data for feature_requests (only if empty)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  
  IF admin_user_id IS NOT NULL AND (SELECT COUNT(*) FROM public.feature_requests) = 0 THEN
    INSERT INTO public.feature_requests (user_id, title, description, category, priority, status, votes)
    VALUES
      (admin_user_id, 'Mobile Security App', 'Develop a mobile application for security guards to manage incidents and patrols on-the-go', 'mobile', 'high', 'under_review', 15),
      (admin_user_id, 'Facial Recognition Integration', 'Integrate facial recognition technology with existing CCTV systems for enhanced security monitoring', 'security', 'high', 'approved', 23),
      (admin_user_id, 'Automated Incident Reporting', 'Implement AI-powered automated incident detection and reporting from security cameras', 'automation', 'medium', 'in_progress', 8);
  END IF;
END
$$;

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