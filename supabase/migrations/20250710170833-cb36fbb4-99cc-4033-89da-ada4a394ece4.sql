-- Phase 1: Critical Database Fixes

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

-- Fix content_categories policies
DROP POLICY IF EXISTS "Anyone can view active content categories" ON content_categories;
CREATE POLICY "Anyone can view active content categories" 
ON content_categories 
FOR SELECT 
USING (is_active = true);

-- 3. Add unique constraints to critical tables
ALTER TABLE profiles ADD CONSTRAINT unique_profile_per_user UNIQUE (id);
ALTER TABLE loyalty_points ADD CONSTRAINT unique_loyalty_per_user UNIQUE (user_id);

-- 4. Fix foreign key references - ensure maintenance_categories exists
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
  escalation_minutes INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default SLA rules
INSERT INTO sla_escalation_rules (priority, target_minutes, escalation_minutes)
VALUES 
  ('urgent', 30, 15),
  ('high', 120, 60),
  ('medium', 240, 120),
  ('low', 480, 240)
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

-- 7. Create user performance tracking
CREATE TABLE IF NOT EXISTS user_performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  efficiency_score DECIMAL(5,2) DEFAULT 0.00,
  quality_score DECIMAL(5,2) DEFAULT 0.00,
  reliability_score DECIMAL(5,2) DEFAULT 0.00,
  productivity_score DECIMAL(5,2) DEFAULT 0.00,
  customer_satisfaction_score DECIMAL(5,2) DEFAULT 0.00,
  total_tasks_completed INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(8,2) DEFAULT 0.00,
  sla_compliance_rate DECIMAL(5,2) DEFAULT 100.00,
  attendance_rate DECIMAL(5,2) DEFAULT 100.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric_date)
);

ALTER TABLE user_performance_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own performance scores" 
ON user_performance_scores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all performance scores" 
ON user_performance_scores 
FOR SELECT 
USING (is_staff(auth.uid()));

-- 8. Create task assignments table for better workflow management
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_to UUID NOT NULL REFERENCES profiles(id),
  assigned_by UUID REFERENCES profiles(id),
  task_title TEXT NOT NULL,
  task_description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  category_id UUID REFERENCES simple_task_categories(id),
  estimated_completion TIMESTAMPTZ,
  actual_completion TIMESTAMPTZ,
  supervisor_approval BOOLEAN DEFAULT false,
  approval_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their assigned tasks" 
ON task_assignments 
FOR SELECT 
USING (auth.uid() = assigned_to OR is_staff(auth.uid()));

CREATE POLICY "Staff can create task assignments" 
ON task_assignments 
FOR INSERT 
WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update task assignments" 
ON task_assignments 
FOR UPDATE 
USING (is_staff(auth.uid()) OR auth.uid() = assigned_to);

-- 9. Create staff attendance table for performance tracking
CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES profiles(id),
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  check_out_time TIMESTAMPTZ,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own attendance" 
ON staff_attendance 
FOR ALL 
USING (auth.uid() = staff_id);

CREATE POLICY "Staff can view all attendance" 
ON staff_attendance 
FOR SELECT 
USING (is_staff(auth.uid()));