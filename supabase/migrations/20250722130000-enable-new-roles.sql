-- Phase 1: Role Expansion - Database Foundation
-- Add new roles to app_role enum and required columns

-- Add new roles to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'site_manager';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'sustain_mgr';  
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'fin_analyst';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'tenant_user';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'client_readonly';

-- Add department specialization for field_staff
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department_specialization TEXT;

-- Create role-to-category mapping table for enhanced auto-assignment
CREATE TABLE IF NOT EXISTS public.task_category_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  role app_role NOT NULL,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(category, role)
);

-- Create escalation rules table
CREATE TABLE IF NOT EXISTS public.ticket_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  from_role app_role NOT NULL,
  to_role app_role NOT NULL,
  escalated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT DEFAULT 'Auto-escalation due to timeout',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_category_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_escalations ENABLE ROW LEVEL SECURITY;

-- Insert role-to-category mappings
INSERT INTO public.task_category_roles (category, role, priority) VALUES
('Cleaning', 'field_staff', 1),
('Security', 'field_staff', 1), 
('HVAC', 'field_staff', 1),
('Electrical', 'field_staff', 1),
('Plumbing', 'field_staff', 1),
('General Maintenance', 'field_staff', 1),
('IT Support', 'field_staff', 1),
('Safety', 'field_staff', 1),
-- Escalation to site manager
('Cleaning', 'site_manager', 2),
('Security', 'site_manager', 2),
('HVAC', 'site_manager', 2),
('Electrical', 'site_manager', 2),
('Plumbing', 'site_manager', 2),
('General Maintenance', 'site_manager', 2),
('IT Support', 'site_manager', 2),
('Safety', 'site_manager', 2),
-- Final escalation to ops supervisor
('Cleaning', 'ops_supervisor', 3),
('Security', 'ops_supervisor', 3),
('HVAC', 'ops_supervisor', 3),
('Electrical', 'ops_supervisor', 3),
('Plumbing', 'ops_supervisor', 3),
('General Maintenance', 'ops_supervisor', 3),
('IT Support', 'ops_supervisor', 3),
('Safety', 'ops_supervisor', 3)
ON CONFLICT (category, role) DO NOTHING;

-- Create RLS policies for new tables
CREATE POLICY "Staff can view task category roles" 
ON public.task_category_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'ops_supervisor', 'site_manager', 'field_staff')
  )
);

CREATE POLICY "Admins can manage task category roles" 
ON public.task_category_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Staff can view escalations" 
ON public.ticket_escalations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'ops_supervisor', 'site_manager', 'field_staff')
  )
);

CREATE POLICY "System can create escalations" 
ON public.ticket_escalations 
FOR INSERT 
WITH CHECK (true);

-- Enhanced auto-assignment function v2
CREATE OR REPLACE FUNCTION public.suggest_optimal_staff_assignment_v2(
  request_category TEXT,
  request_priority TEXT DEFAULT 'medium',
  request_location TEXT DEFAULT NULL,
  exclude_user_ids UUID[] DEFAULT '{}'
) RETURNS TABLE(
  staff_id UUID,
  staff_name TEXT,
  role TEXT,
  department_specialization TEXT,
  current_workload INTEGER,
  match_score DECIMAL,
  estimated_completion_hours DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_roles app_role[];
  priority_multiplier DECIMAL;
BEGIN
  -- Get target roles for the category in priority order
  SELECT ARRAY_AGG(role ORDER BY priority) INTO target_roles
  FROM task_category_roles 
  WHERE category = request_category;
  
  -- If no specific mapping, use default hierarchy
  IF target_roles IS NULL OR array_length(target_roles, 1) = 0 THEN
    target_roles := ARRAY['field_staff', 'site_manager', 'ops_supervisor']::app_role[];
  END IF;
  
  -- Set priority multiplier
  priority_multiplier := CASE 
    WHEN request_priority = 'urgent' THEN 2.0
    WHEN request_priority = 'high' THEN 1.5
    WHEN request_priority = 'medium' THEN 1.0
    ELSE 0.8
  END;

  RETURN QUERY
  WITH staff_workload AS (
    SELECT 
      p.id,
      COALESCE(p.first_name || ' ' || p.last_name, 'Unknown User') as name,
      p.role::TEXT,
      p.department_specialization,
      COUNT(mr.id) as current_requests,
      -- Calculate skill match score
      CASE 
        WHEN p.role = ANY(target_roles) THEN 
          (array_position(target_roles, p.role) * -10 + 100)::DECIMAL
        ELSE 50::DECIMAL 
      END as base_score,
      -- Estimate completion time based on workload and priority
      (COUNT(mr.id) * 2 + CASE 
        WHEN request_priority = 'urgent' THEN 1
        WHEN request_priority = 'high' THEN 2
        WHEN request_priority = 'medium' THEN 4
        ELSE 8
      END)::DECIMAL as est_hours
    FROM profiles p
    LEFT JOIN maintenance_requests mr ON mr.assigned_to = p.id 
      AND mr.status IN ('pending', 'in_progress', 'on_hold')
    WHERE p.role = ANY(target_roles)
      AND p.approval_status = 'approved'
      AND (p.id != ALL(exclude_user_ids) OR exclude_user_ids IS NULL)
    GROUP BY p.id, p.first_name, p.last_name, p.role, p.department_specialization
  )
  SELECT 
    sw.id,
    sw.name,
    sw.role,
    sw.department_specialization,
    sw.current_requests,
    (sw.base_score - (sw.current_requests * 5) + 
     CASE WHEN sw.department_specialization = request_category THEN 20 ELSE 0 END) * priority_multiplier as final_score,
    sw.est_hours
  FROM staff_workload sw
  ORDER BY final_score DESC, sw.current_requests ASC
  LIMIT 5;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.suggest_optimal_staff_assignment_v2(TEXT, TEXT, TEXT, UUID[]) TO authenticated;