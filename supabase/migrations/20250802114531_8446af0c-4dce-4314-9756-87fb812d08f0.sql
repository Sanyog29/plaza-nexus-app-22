-- Create access_points table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.access_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'door' CHECK (type IN ('door', 'gate', 'barrier', 'turnstile', 'elevator')),
  location TEXT NOT NULL,
  floor TEXT NOT NULL,
  zone TEXT,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance', 'error')),
  is_locked BOOLEAN NOT NULL DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  device_id TEXT,
  firmware_version TEXT,
  battery_level INTEGER CHECK (battery_level BETWEEN 0 AND 100),
  signal_strength INTEGER CHECK (signal_strength BETWEEN 0 AND 100),
  access_level_required TEXT NOT NULL DEFAULT 'basic',
  emergency_override BOOLEAN NOT NULL DEFAULT false,
  maintenance_due DATE,
  installation_date DATE,
  warranty_expiry DATE,
  vendor TEXT,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_systems table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cctv', 'alarm', 'fire_detection', 'intrusion', 'access_control', 'intercom')),
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'warning', 'critical', 'maintenance', 'offline')),
  location TEXT NOT NULL,
  floor TEXT,
  zone TEXT,
  last_check TIMESTAMP WITH TIME ZONE,
  next_maintenance DATE,
  alerts_count INTEGER NOT NULL DEFAULT 0,
  uptime_percentage DECIMAL(5,2) DEFAULT 99.0,
  vendor TEXT,
  model TEXT,
  serial_number TEXT,
  installation_date DATE,
  warranty_expiry DATE,
  ip_address INET,
  firmware_version TEXT,
  configuration JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS if tables are new
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'access_points') THEN
    ALTER TABLE public.access_points ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Staff can view access points"
    ON public.access_points FOR SELECT
    USING (is_staff(auth.uid()));

    CREATE POLICY "Admins can manage access points"
    ON public.access_points FOR ALL
    USING (is_admin(auth.uid()));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_systems') THEN
    ALTER TABLE public.security_systems ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Staff can view security systems"
    ON public.security_systems FOR SELECT
    USING (is_staff(auth.uid()));

    CREATE POLICY "Admins can manage security systems"
    ON public.security_systems FOR ALL
    USING (is_admin(auth.uid()));
  END IF;
END
$$;

-- Insert sample data only if tables are empty
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
WHERE NOT EXISTS (SELECT 1 FROM public.access_points LIMIT 1);

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
WHERE NOT EXISTS (SELECT 1 FROM public.security_systems LIMIT 1);