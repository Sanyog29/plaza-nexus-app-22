-- Create assets management table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'hvac', 'electrical', 'plumbing', 'security', 'fire_safety'
  location TEXT NOT NULL,
  floor TEXT NOT NULL,
  zone TEXT,
  brand TEXT,
  model_number TEXT,
  serial_number TEXT,
  purchase_date DATE,
  installation_date DATE,
  warranty_expiry DATE,
  last_service_date DATE,
  next_service_due DATE,
  service_frequency_months INTEGER DEFAULT 12, -- How often service is needed
  amc_vendor TEXT,
  amc_contract_number TEXT,
  amc_start_date DATE,
  amc_end_date DATE,
  amc_cost DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'operational', -- 'operational', 'under_maintenance', 'faulty', 'decommissioned'
  notes TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AMC alerts table
CREATE TABLE IF NOT EXISTS public.amc_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'service_due', 'warranty_expiry', 'amc_renewal'
  alert_date DATE NOT NULL,
  due_date DATE NOT NULL,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service records table
CREATE TABLE IF NOT EXISTS public.service_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL, -- 'routine', 'breakdown', 'installation', 'warranty'
  service_date DATE NOT NULL,
  performed_by TEXT, -- Vendor or internal staff
  service_description TEXT NOT NULL,
  issues_found TEXT,
  actions_taken TEXT,
  parts_replaced TEXT,
  cost DECIMAL(10,2),
  invoice_number TEXT,
  invoice_url TEXT,
  next_service_date DATE,
  warranty_extended_until DATE,
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  performed_by_user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create simplified task categories for dropdown-only forms
CREATE TABLE IF NOT EXISTS public.simple_task_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  estimated_time_minutes INTEGER,
  required_skills TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create task assignments table for better supervisor control
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(id),
  assigned_to UUID NOT NULL REFERENCES public.profiles(id),
  assignment_notes TEXT,
  estimated_completion TIMESTAMP WITH TIME ZONE,
  actual_completion TIMESTAMP WITH TIME ZONE,
  supervisor_approval BOOLEAN DEFAULT false,
  approval_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amc_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simple_task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assets
CREATE POLICY "Staff can view all assets" ON public.assets FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Supervisors can manage assets" ON public.assets FOR ALL USING (is_admin(auth.uid()) OR (
  SELECT role FROM public.profiles WHERE id = auth.uid()
) IN ('ops_l2', 'admin'));

-- RLS Policies for AMC alerts
CREATE POLICY "Staff can view AMC alerts" ON public.amc_alerts FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Supervisors can manage AMC alerts" ON public.amc_alerts FOR ALL USING (is_admin(auth.uid()) OR (
  SELECT role FROM public.profiles WHERE id = auth.uid()
) IN ('ops_l2', 'admin'));

-- RLS Policies for service records
CREATE POLICY "Staff can view service records" ON public.service_records FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can create service records" ON public.service_records FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Supervisors can manage service records" ON public.service_records FOR ALL USING (is_admin(auth.uid()) OR (
  SELECT role FROM public.profiles WHERE id = auth.uid()
) IN ('ops_l2', 'admin'));

-- RLS Policies for simple task categories
CREATE POLICY "Everyone can view task categories" ON public.simple_task_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage task categories" ON public.simple_task_categories FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for task assignments
CREATE POLICY "Staff can view their assignments" ON public.task_assignments FOR SELECT USING (
  assigned_to = auth.uid() OR assigned_by = auth.uid() OR is_staff(auth.uid())
);
CREATE POLICY "Supervisors can create assignments" ON public.task_assignments FOR INSERT WITH CHECK (
  is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ops_l2', 'admin')
);
CREATE POLICY "Supervisors can manage assignments" ON public.task_assignments FOR ALL USING (
  assigned_by = auth.uid() OR is_admin(auth.uid()) OR (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) IN ('ops_l2', 'admin')
);

-- Add triggers for updated_at
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_amc_alerts_updated_at BEFORE UPDATE ON public.amc_alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_records_updated_at BEFORE UPDATE ON public.service_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_task_assignments_updated_at BEFORE UPDATE ON public.task_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample simple task categories
INSERT INTO public.simple_task_categories (name, description, estimated_time_minutes, required_skills) VALUES
('AC Filter Cleaning', 'Clean and replace AC filters', 30, ARRAY['basic_maintenance']),
('Light Bulb Replacement', 'Replace faulty light bulbs', 15, ARRAY['basic_electrical']),
('Plumbing Fix - Minor', 'Fix minor plumbing issues', 45, ARRAY['basic_plumbing']),
('Door Lock Repair', 'Repair or replace door locks', 60, ARRAY['locksmith']),
('Electrical Outlet Repair', 'Fix faulty electrical outlets', 90, ARRAY['electrical']),
('Ceiling Fan Service', 'Service and clean ceiling fans', 45, ARRAY['basic_maintenance']),
('Window Cleaning', 'Clean windows and glass surfaces', 30, ARRAY['cleaning']),
('Carpet Cleaning', 'Deep clean carpets and upholstery', 120, ARRAY['cleaning']),
('Pest Control', 'Apply pest control measures', 60, ARRAY['pest_control']),
('Safety Equipment Check', 'Inspect fire extinguishers and safety equipment', 30, ARRAY['safety']);

-- Insert sample assets
INSERT INTO public.assets (asset_name, asset_type, location, floor, zone, brand, model_number, service_frequency_months, amc_vendor, status) VALUES
('Main Lobby AC Unit 1', 'hvac', 'Main Lobby', 'ground', 'lobby_main', 'Carrier', 'CA-5000', 6, 'Cool Breeze Services', 'operational'),
('Floor 1 East AC Unit', 'hvac', 'Floor 1 East Wing', '1', 'floor_1_east', 'Daikin', 'DK-3000', 6, 'Cool Breeze Services', 'operational'),
('Main Electrical Panel', 'electrical', 'Basement Utility Room', 'basement', 'basement_utilities', 'Schneider', 'SE-2000', 12, 'ElectroTech Solutions', 'operational'),
('Fire Safety System', 'fire_safety', 'Building Wide', 'all', 'building_wide', 'Honeywell', 'HS-1000', 12, 'SafeGuard Systems', 'operational'),
('Water Pump System', 'plumbing', 'Basement Utility Room', 'basement', 'basement_utilities', 'Grundfos', 'GR-500', 6, 'AquaTech Services', 'operational');

-- Function to automatically create AMC alerts
CREATE OR REPLACE FUNCTION public.create_amc_alerts()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  asset_record RECORD;
  alert_date DATE;
BEGIN
  -- Clear existing future alerts
  DELETE FROM public.amc_alerts WHERE alert_date > CURRENT_DATE AND is_sent = false;
  
  -- Create alerts for assets with upcoming service dates
  FOR asset_record IN 
    SELECT * FROM public.assets 
    WHERE status = 'operational' 
    AND next_service_due IS NOT NULL 
    AND next_service_due > CURRENT_DATE
  LOOP
    -- Create 7-day warning alert
    alert_date := asset_record.next_service_due - INTERVAL '7 days';
    IF alert_date >= CURRENT_DATE THEN
      INSERT INTO public.amc_alerts (asset_id, alert_type, alert_date, due_date)
      VALUES (asset_record.id, 'service_due', alert_date, asset_record.next_service_due);
    END IF;
  END LOOP;
  
  -- Create alerts for AMC renewals
  FOR asset_record IN 
    SELECT * FROM public.assets 
    WHERE status = 'operational' 
    AND amc_end_date IS NOT NULL 
    AND amc_end_date > CURRENT_DATE
  LOOP
    -- Create 30-day warning for AMC renewal
    alert_date := asset_record.amc_end_date - INTERVAL '30 days';
    IF alert_date >= CURRENT_DATE THEN
      INSERT INTO public.amc_alerts (asset_id, alert_type, alert_date, due_date)
      VALUES (asset_record.id, 'amc_renewal', alert_date, asset_record.amc_end_date);
    END IF;
  END LOOP;
END;
$$;