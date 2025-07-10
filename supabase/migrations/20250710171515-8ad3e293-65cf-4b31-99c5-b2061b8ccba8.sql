-- Phase 1 Continued: Performance and workflow tables

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

-- 10. Enable realtime for critical tables
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE task_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE staff_attendance;