-- Create feature_requests table to replace localStorage usage
CREATE TABLE public.feature_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'in_progress', 'completed')),
  votes INTEGER NOT NULL DEFAULT 0,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  implementation_notes TEXT,
  estimated_effort_hours INTEGER,
  business_impact TEXT,
  technical_complexity TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on feature_requests
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for feature_requests
CREATE POLICY "Users can view all feature requests"
ON public.feature_requests FOR SELECT
USING (true);

CREATE POLICY "Users can create their own feature requests"
ON public.feature_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature requests"
ON public.feature_requests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all feature requests"
ON public.feature_requests FOR ALL
USING (is_admin(auth.uid()));

-- Create access_points table for real access control management
CREATE TABLE public.access_points (
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

-- Enable RLS on access_points
ALTER TABLE public.access_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for access_points
CREATE POLICY "Staff can view access points"
ON public.access_points FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage access points"
ON public.access_points FOR ALL
USING (is_admin(auth.uid()));

-- Create security_systems table for system monitoring
CREATE TABLE public.security_systems (
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

-- Enable RLS on security_systems
ALTER TABLE public.security_systems ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_systems
CREATE POLICY "Staff can view security systems"
ON public.security_systems FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage security systems"
ON public.security_systems FOR ALL
USING (is_admin(auth.uid()));

-- Insert sample data for access_points
INSERT INTO public.access_points (name, type, location, floor, zone, status, is_locked, last_activity, access_level_required) VALUES
('Main Entrance', 'door', 'Lobby', 'Ground', 'A', 'online', false, now() - interval '5 minutes', 'basic'),
('Server Room', 'door', 'IT Department', '2nd', 'B', 'online', true, now() - interval '2 hours', 'high'),
('Parking Gate A', 'gate', 'Parking Area A', 'Basement', 'P1', 'online', false, now() - interval '1 hour', 'basic'),
('Executive Floor', 'elevator', 'Executive Area', '10th', 'E', 'online', true, now() - interval '30 minutes', 'executive'),
('Emergency Exit B', 'door', 'East Wing', '3rd', 'C', 'online', false, now() - interval '1 day', 'emergency'),
('Loading Dock', 'barrier', 'Loading Area', 'Ground', 'L', 'maintenance', false, now() - interval '3 hours', 'staff'),
('Cafeteria Entrance', 'turnstile', 'Cafeteria', '1st', 'D', 'online', false, now() - interval '15 minutes', 'basic'),
('Data Center', 'door', 'Data Center', 'Basement', 'DC', 'online', true, now() - interval '6 hours', 'restricted');

-- Insert sample data for security_systems
INSERT INTO public.security_systems (name, type, status, location, floor, zone, last_check, alerts_count, uptime_percentage) VALUES
('CCTV System Alpha', 'cctv', 'operational', 'All Floors', 'All', 'All', now() - interval '1 hour', 0, 99.8),
('Fire Detection West', 'fire_detection', 'operational', 'West Wing', 'All', 'W', now() - interval '30 minutes', 1, 99.9),
('Intrusion System Main', 'intrusion', 'operational', 'Perimeter', 'Ground', 'A', now() - interval '2 hours', 0, 99.5),
('Access Control Hub', 'access_control', 'operational', 'Security Office', 'Ground', 'S', now() - interval '5 minutes', 2, 98.9),
('Alarm System Floor 5', 'alarm', 'warning', '5th Floor', '5th', 'B', now() - interval '4 hours', 3, 97.2),
('Intercom Network', 'intercom', 'operational', 'All Locations', 'All', 'All', now() - interval '1 hour', 0, 99.7),
('CCTV Parking', 'cctv', 'operational', 'Parking Areas', 'Basement', 'P', now() - interval '45 minutes', 1, 99.3),
('Fire System East', 'fire_detection', 'critical', 'East Wing', 'All', 'E', now() - interval '6 hours', 5, 85.4);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_requests_updated_at
BEFORE UPDATE ON public.feature_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_access_points_updated_at
BEFORE UPDATE ON public.access_points
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_systems_updated_at
BEFORE UPDATE ON public.security_systems
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add some sample feature requests
INSERT INTO public.feature_requests (user_id, title, description, category, priority, status, votes) VALUES
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
 'automation', 'medium', 'in_progress', 8);