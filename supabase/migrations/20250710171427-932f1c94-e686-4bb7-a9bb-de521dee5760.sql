-- Phase 1: Critical Database Fixes (Corrected)

-- 1. Fix RLS policy conflicts for maintenance_requests
-- First drop the duplicate policies
DROP POLICY IF EXISTS "Users can create maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can update their maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can view their maintenance requests" ON maintenance_requests;

-- Recreate consolidated policies
CREATE POLICY "Users can manage their maintenance requests" 
ON maintenance_requests 
FOR ALL 
USING (auth.uid() = reported_by) 
WITH CHECK (auth.uid() = reported_by);

-- 2. Add missing WITH CHECK constraints for INSERT operations
-- Fix visitor_categories policy
DROP POLICY IF EXISTS "Anyone can view visitor categories" ON visitor_categories;
CREATE POLICY "Anyone can view visitor categories" 
ON visitor_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can insert visitor categories" 
ON visitor_categories 
FOR INSERT 
WITH CHECK (is_admin(auth.uid()));

-- 3. Add unique constraints to critical tables (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_profile_per_user') THEN
        ALTER TABLE profiles ADD CONSTRAINT unique_profile_per_user UNIQUE (id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_loyalty_per_user') THEN
        ALTER TABLE loyalty_points ADD CONSTRAINT unique_loyalty_per_user UNIQUE (user_id);
    END IF;
END $$;

-- 4. Ensure maintenance_categories exists with proper data
INSERT INTO maintenance_categories (id, name, description, icon) 
VALUES 
  (gen_random_uuid(), 'General Maintenance', 'General maintenance requests', 'wrench'),
  (gen_random_uuid(), 'Electrical', 'Electrical issues and repairs', 'zap'),
  (gen_random_uuid(), 'Plumbing', 'Water and plumbing related issues', 'droplets'),
  (gen_random_uuid(), 'HVAC', 'Heating, ventilation, and air conditioning', 'wind'),
  (gen_random_uuid(), 'Cleaning', 'Cleaning and housekeeping requests', 'sparkles')
ON CONFLICT (id) DO NOTHING;

-- 5. Create proper escalation and SLA management
CREATE TABLE IF NOT EXISTS sla_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority TEXT NOT NULL,
  category_filter UUID REFERENCES maintenance_categories(id),
  target_minutes INTEGER NOT NULL DEFAULT 240,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default SLA rules (corrected column name)
INSERT INTO sla_escalation_rules (priority, target_minutes)
VALUES 
  ('urgent', 30),
  ('high', 120),
  ('medium', 240),
  ('low', 480)
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE sla_escalation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view SLA rules" 
ON sla_escalation_rules 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage SLA rules" 
ON sla_escalation_rules 
FOR ALL 
USING (is_admin(auth.uid()));

-- 6. Create service penalty matrix for SLA breaches
CREATE TABLE IF NOT EXISTS service_penalty_matrix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, priority)
);

-- Insert default penalties
INSERT INTO service_penalty_matrix (category, priority, amount, description)
VALUES 
  ('sla_breach', 'urgent', 500.00, 'Penalty for urgent SLA breach'),
  ('sla_breach', 'high', 250.00, 'Penalty for high priority SLA breach'),
  ('sla_breach', 'medium', 100.00, 'Penalty for medium priority SLA breach'),
  ('sla_breach', 'low', 50.00, 'Penalty for low priority SLA breach')
ON CONFLICT (category, priority) DO NOTHING;

ALTER TABLE service_penalty_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view penalty matrix" 
ON service_penalty_matrix 
FOR SELECT 
USING (is_staff(auth.uid()));