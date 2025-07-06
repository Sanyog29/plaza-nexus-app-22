-- Phase 1: Fix trigger dependency issue first
-- Drop the trigger that depends on the role column
DROP TRIGGER IF EXISTS profile_role_change_audit ON public.profiles;

-- Now proceed with role system update
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
    ELSE 'tenant_manager'::public.app_role
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