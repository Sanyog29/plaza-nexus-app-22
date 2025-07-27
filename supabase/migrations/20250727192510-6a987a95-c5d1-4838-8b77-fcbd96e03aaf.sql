-- Phase 1: Create missing security management tables

-- Create access_points table
CREATE TABLE public.access_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  floor TEXT NOT NULL,
  zone TEXT,
  device_type TEXT NOT NULL DEFAULT 'card_reader',
  device_id TEXT UNIQUE,
  ip_address INET,
  status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance', 'error')),
  last_ping TIMESTAMP WITH TIME ZONE,
  firmware_version TEXT,
  configuration JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_systems table
CREATE TABLE public.security_systems (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  system_type TEXT NOT NULL CHECK (system_type IN ('cctv', 'alarm', 'fire', 'access_control', 'intercom')),
  location TEXT NOT NULL,
  floor TEXT NOT NULL,
  zone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'fault')),
  last_check TIMESTAMP WITH TIME ZONE,
  configuration JSONB DEFAULT '{}',
  vendor TEXT,
  model TEXT,
  installation_date DATE,
  warranty_expiry DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_incidents table
CREATE TABLE public.security_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('security_breach', 'unauthorized_access', 'system_malfunction', 'visitor_issue', 'emergency', 'theft', 'vandalism', 'other')),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  location TEXT NOT NULL,
  floor TEXT,
  zone TEXT,
  reported_by UUID NOT NULL,
  assigned_to UUID,
  resolved_by UUID,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  evidence JSONB DEFAULT '[]',
  witnesses JSONB DEFAULT '[]',
  actions_taken TEXT,
  resolution_notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_permissions table
CREATE TABLE public.security_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('admin', 'supervisor', 'guard', 'read_only')),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('visitors', 'incidents', 'access_points', 'systems', 'reports', 'analytics')),
  resource_id UUID,
  access_level TEXT NOT NULL DEFAULT 'read' CHECK (access_level IN ('none', 'read', 'write', 'admin')),
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create feature_requests table
CREATE TABLE public.feature_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('security', 'visitor_management', 'access_control', 'reporting', 'mobile_app', 'integration', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'in_development', 'testing', 'completed', 'rejected')),
  requested_by UUID NOT NULL,
  assigned_to UUID,
  business_justification TEXT,
  estimated_effort TEXT,
  expected_completion DATE,
  votes INTEGER DEFAULT 0,
  comments JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create access_logs table
CREATE TABLE public.access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_point_id UUID REFERENCES public.access_points(id) ON DELETE CASCADE,
  user_id UUID,
  visitor_id UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL CHECK (access_type IN ('entry', 'exit', 'denied', 'forced')),
  access_method TEXT NOT NULL CHECK (access_method IN ('card', 'pin', 'biometric', 'qr_code', 'manual', 'emergency')),
  card_id TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  location TEXT NOT NULL,
  floor TEXT,
  zone TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security_metrics table
CREATE TABLE public.security_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('visitors', 'incidents', 'access_attempts', 'system_uptime', 'response_time')),
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT NOT NULL DEFAULT 'count',
  location TEXT,
  floor TEXT,
  zone TEXT,
  metadata JSONB DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.access_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for access_points
CREATE POLICY "Staff can view access points" ON public.access_points
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage access points" ON public.access_points
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for security_systems
CREATE POLICY "Staff can view security systems" ON public.security_systems
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage security systems" ON public.security_systems
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for security_incidents
CREATE POLICY "Staff can view security incidents" ON public.security_incidents
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can create security incidents" ON public.security_incidents
  FOR INSERT WITH CHECK (is_staff(auth.uid()) AND reported_by = auth.uid());

CREATE POLICY "Admins can manage security incidents" ON public.security_incidents
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Assigned staff can update incidents" ON public.security_incidents
  FOR UPDATE USING (is_staff(auth.uid()) AND (assigned_to = auth.uid() OR is_admin(auth.uid())));

-- RLS Policies for security_permissions
CREATE POLICY "Users can view their own permissions" ON public.security_permissions
  FOR SELECT USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all permissions" ON public.security_permissions
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for feature_requests
CREATE POLICY "Users can view their own feature requests" ON public.feature_requests
  FOR SELECT USING (requested_by = auth.uid() OR is_staff(auth.uid()));

CREATE POLICY "Users can create feature requests" ON public.feature_requests
  FOR INSERT WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Users can update their own requests" ON public.feature_requests
  FOR UPDATE USING (requested_by = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage all feature requests" ON public.feature_requests
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for access_logs
CREATE POLICY "Staff can view access logs" ON public.access_logs
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "System can create access logs" ON public.access_logs
  FOR INSERT WITH CHECK (true); -- Allow system insertions

-- RLS Policies for security_metrics
CREATE POLICY "Staff can view security metrics" ON public.security_metrics
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage security metrics" ON public.security_metrics
  FOR ALL USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_access_points_status ON public.access_points(status);
CREATE INDEX idx_access_points_location ON public.access_points(location, floor);
CREATE INDEX idx_security_systems_status ON public.security_systems(status);
CREATE INDEX idx_security_systems_type ON public.security_systems(system_type);
CREATE INDEX idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_security_incidents_occurred_at ON public.security_incidents(occurred_at);
CREATE INDEX idx_security_permissions_user_id ON public.security_permissions(user_id);
CREATE INDEX idx_feature_requests_status ON public.feature_requests(status);
CREATE INDEX idx_feature_requests_requested_by ON public.feature_requests(requested_by);
CREATE INDEX idx_access_logs_timestamp ON public.access_logs(timestamp);
CREATE INDEX idx_access_logs_user_visitor ON public.access_logs(user_id, visitor_id);
CREATE INDEX idx_security_metrics_date_type ON public.security_metrics(metric_date, metric_type);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_access_points_updated_at BEFORE UPDATE ON public.access_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_systems_updated_at BEFORE UPDATE ON public.security_systems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_incidents_updated_at BEFORE UPDATE ON public.security_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_permissions_updated_at BEFORE UPDATE ON public.security_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_requests_updated_at BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for access points
INSERT INTO public.access_points (name, location, floor, zone, device_type, device_id, status) VALUES
('Main Entrance', 'Lobby', 'Ground Floor', 'Zone A', 'card_reader', 'AP-001', 'online'),
('Reception Desk', 'Reception', 'Ground Floor', 'Zone A', 'card_reader', 'AP-002', 'online'),
('Server Room', 'IT Department', '2nd Floor', 'Zone B', 'biometric', 'AP-003', 'online'),
('Executive Floor', 'Executive Area', '10th Floor', 'Zone C', 'card_reader', 'AP-004', 'maintenance'),
('Emergency Exit', 'Stairwell', 'Ground Floor', 'Zone A', 'emergency', 'AP-005', 'online');

-- Insert sample data for security systems
INSERT INTO public.security_systems (name, system_type, location, floor, zone, status) VALUES
('Main CCTV Network', 'cctv', 'Security Control Room', 'Ground Floor', 'Zone A', 'active'),
('Fire Detection System', 'fire', 'Building Wide', 'All Floors', 'All Zones', 'active'),
('Intrusion Alarm', 'alarm', 'Perimeter', 'Ground Floor', 'Zone A', 'active'),
('Access Control Hub', 'access_control', 'Security Control Room', 'Ground Floor', 'Zone A', 'active'),
('Emergency Intercom', 'intercom', 'Building Wide', 'All Floors', 'All Zones', 'maintenance');