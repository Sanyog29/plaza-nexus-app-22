-- Phase 1: Core SLA Engine & Role Restructuring
-- Update user roles to match 5-tier structure
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'ops_supervisor', 'field_staff', 'tenant_manager', 'vendor');

-- Update profiles table to use new role system
ALTER TABLE public.profiles 
ALTER COLUMN role DROP DEFAULT,
ALTER COLUMN role TYPE public.app_role USING 
  CASE 
    WHEN role = 'admin' THEN 'admin'::public.app_role
    WHEN role IN ('staff', 'ops_l2') THEN 'ops_supervisor'::public.app_role
    WHEN role = 'ops_l1' THEN 'field_staff'::public.app_role
    WHEN role = 'tenant' THEN 'tenant_manager'::public.app_role
    ELSE 'field_staff'::public.app_role
  END,
ALTER COLUMN role SET DEFAULT 'tenant_manager'::public.app_role;

DROP TYPE public.app_role_old;

-- Add SLA tracking fields to maintenance_requests
ALTER TABLE public.maintenance_requests ADD COLUMN IF NOT EXISTS
  request_source TEXT DEFAULT 'tenant' CHECK (request_source IN ('tenant', 'supervisor', 'auto_generated', 'preventive')),
ADD COLUMN IF NOT EXISTS
  subcategory TEXT,
ADD COLUMN IF NOT EXISTS
  response_time_target_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS
  resolution_time_target_minutes INTEGER DEFAULT 240,  
ADD COLUMN IF NOT EXISTS
  first_response_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS
  sla_status TEXT DEFAULT 'within_sla' CHECK (sla_status IN ('within_sla', 'near_breach', 'breached')),
ADD COLUMN IF NOT EXISTS
  escalation_level INTEGER DEFAULT 1 CHECK (escalation_level IN (1, 2, 3)),
ADD COLUMN IF NOT EXISTS
  auto_escalated_at TIMESTAMP WITH TIME ZONE;

-- Create escalation_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.escalation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  from_level INTEGER NOT NULL,
  to_level INTEGER NOT NULL,
  escalated_by UUID REFERENCES public.profiles(id),
  escalation_reason TEXT NOT NULL,
  escalated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create SLA configuration table
CREATE TABLE IF NOT EXISTS public.sla_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  subcategory TEXT,
  priority TEXT NOT NULL,
  response_time_minutes INTEGER NOT NULL,
  resolution_time_minutes INTEGER NOT NULL,
  escalation_buffer_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category, subcategory, priority)
);

-- Insert SLA configurations from specification
INSERT INTO public.sla_configs (category, subcategory, priority, response_time_minutes, resolution_time_minutes) VALUES
('electrical', 'lighting', 'medium', 60, 240),
('electrical', 'socket', 'medium', 60, 240),
('electrical', 'panel_fault', 'high', 60, 360),
('hvac', 'cooling', 'high', 60, 360),
('hvac', 'vrf', 'high', 60, 360),
('hvac', 'filter', 'medium', 60, 240),
('plumbing', 'leakage', 'medium', 60, 360),
('plumbing', 'flush', 'medium', 60, 360),
('plumbing', 'taps', 'low', 60, 360),
('housekeeping', 'cleaning', 'low', 30, 120),
('housekeeping', 'restroom', 'medium', 30, 120),
('housekeeping', 'spills', 'high', 15, 60),
('pest_control', 'sightings', 'medium', 60, 1440),
('it_support', 'network', 'medium', 60, 480),
('it_support', 'wifi', 'medium', 60, 480),
('cafeteria', 'food_quality', 'medium', 60, 240),
('cafeteria', 'hygiene', 'high', 30, 120),
('security', 'visitor', 'high', 5, 120),
('security', 'access', 'high', 5, 120),
('safety', 'lift', 'critical', 15, 120),
('safety', 'fire', 'critical', 15, 120),
('utilities', 'power', 'high', 30, 180),
('utilities', 'water', 'high', 30, 180),
('booking', 'room_conflict', 'medium', 60, 240),
('amc', 'preventive', 'medium', 0, 0);

-- Create vendor_access table for limited vendor permissions
CREATE TABLE IF NOT EXISTS public.vendor_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  service_categories TEXT[] DEFAULT '{}',
  access_level TEXT DEFAULT 'limited' CHECK (access_level IN ('limited', 'full')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create SLA scoring table for monthly compliance tracking
CREATE TABLE IF NOT EXISTS public.sla_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  score_month DATE NOT NULL,
  category TEXT NOT NULL,
  total_tickets INTEGER DEFAULT 0,
  within_sla_tickets INTEGER DEFAULT 0,
  compliance_percentage DECIMAL(5,2) DEFAULT 0.00,
  penalty_applicable BOOLEAN DEFAULT false,
  penalty_percentage DECIMAL(4,2) DEFAULT 0.00,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(score_month, category)
);

-- Enable RLS on new tables
ALTER TABLE public.escalation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_configs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.vendor_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for escalation_logs
CREATE POLICY "Staff can view escalation logs" ON public.escalation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'ops_supervisor', 'field_staff')
    )
  );

CREATE POLICY "Supervisors can create escalation logs" ON public.escalation_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'ops_supervisor')
    )
  );

-- RLS policies for sla_configs
CREATE POLICY "Staff can view SLA configs" ON public.sla_configs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'ops_supervisor', 'field_staff')
    )
  );

CREATE POLICY "Admins can manage SLA configs" ON public.sla_configs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS policies for vendor_access
CREATE POLICY "Vendors can view their own access" ON public.vendor_access
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage vendor access" ON public.vendor_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS policies for sla_scores
CREATE POLICY "Staff can view SLA scores" ON public.sla_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'ops_supervisor')
    )
  );

CREATE POLICY "Admins can manage SLA scores" ON public.sla_scores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Update existing functions to work with new role system
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('admin', 'ops_supervisor', 'field_staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_ops_supervisor(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('admin', 'ops_supervisor')
  );
$$;

-- Function to automatically set SLA targets when creating requests
CREATE OR REPLACE FUNCTION public.set_sla_targets()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  sla_config RECORD;
BEGIN
  -- Get SLA config for this request
  SELECT * INTO sla_config
  FROM public.sla_configs
  WHERE category = COALESCE(NEW.subcategory, 'general')
    AND priority = NEW.priority::text
    AND is_active = true
  LIMIT 1;
  
  -- If no specific config found, use default
  IF NOT FOUND THEN
    SELECT * INTO sla_config
    FROM public.sla_configs
    WHERE category = 'general' 
      AND priority = 'medium'
      AND is_active = true
    LIMIT 1;
  END IF;
  
  -- Set SLA targets
  IF FOUND THEN
    NEW.response_time_target_minutes := sla_config.response_time_minutes;
    NEW.resolution_time_target_minutes := sla_config.resolution_time_minutes;
    NEW.sla_breach_at := NEW.created_at + (sla_config.resolution_time_minutes * INTERVAL '1 minute');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for SLA target setting
DROP TRIGGER IF EXISTS set_sla_targets_trigger ON public.maintenance_requests;
CREATE TRIGGER set_sla_targets_trigger
  BEFORE INSERT ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_sla_targets();

-- Function for SLA monitoring and escalation
CREATE OR REPLACE FUNCTION public.monitor_sla_and_escalate()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  req RECORD;
  escalation_target_id UUID;
BEGIN
  -- Check all open requests for SLA status
  FOR req IN 
    SELECT mr.*, sc.escalation_buffer_minutes
    FROM public.maintenance_requests mr
    LEFT JOIN public.sla_configs sc ON sc.category = COALESCE(mr.subcategory, 'general') 
      AND sc.priority = mr.priority::text
    WHERE mr.status NOT IN ('completed', 'cancelled')
  LOOP
    -- Update SLA status based on time elapsed
    IF req.sla_breach_at <= now() THEN
      UPDATE public.maintenance_requests 
      SET sla_status = 'breached'
      WHERE id = req.id AND sla_status != 'breached';
      
    ELSIF req.sla_breach_at <= now() + INTERVAL '1 hour' THEN
      UPDATE public.maintenance_requests 
      SET sla_status = 'near_breach'
      WHERE id = req.id AND sla_status = 'within_sla';
    END IF;
    
    -- Auto-escalation logic
    IF req.escalation_level = 1 AND req.created_at + INTERVAL '2 hours' <= now() AND req.status = 'pending' THEN
      -- Escalate to supervisor
      UPDATE public.maintenance_requests 
      SET escalation_level = 2, auto_escalated_at = now()
      WHERE id = req.id;
      
      INSERT INTO public.escalation_logs (request_id, from_level, to_level, escalation_reason)
      VALUES (req.id, 1, 2, 'Auto-escalated: No response within 2 hours');
      
    ELSIF req.escalation_level = 2 AND req.sla_breach_at <= now() + INTERVAL '30 minutes' AND req.status != 'completed' THEN
      -- Escalate to admin
      UPDATE public.maintenance_requests 
      SET escalation_level = 3, auto_escalated_at = now()
      WHERE id = req.id;
      
      INSERT INTO public.escalation_logs (request_id, from_level, to_level, escalation_reason)
      VALUES (req.id, 2, 3, 'Auto-escalated: Near SLA breach');
    END IF;
  END LOOP;
END;
$$;