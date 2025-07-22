
-- Phase 1: Role Expansion - Database Foundation
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
('housekeeping', 'field_staff', 1),
('security', 'field_staff', 1),
('facility_ops', 'facility_exec', 1),
('maintenance', 'field_staff', 1),
('hvac', 'field_staff', 1),
('electrical', 'field_staff', 1),
('plumbing', 'field_staff', 1),
-- Fallback escalation chain
('housekeeping', 'site_manager', 2),
('security', 'site_manager', 2),
('facility_ops', 'site_manager', 2),
('maintenance', 'site_manager', 2),
('hvac', 'site_manager', 2),
('electrical', 'site_manager', 2),
('plumbing', 'site_manager', 2),
-- Final escalation
('housekeeping', 'ops_supervisor', 3),
('security', 'ops_supervisor', 3),
('facility_ops', 'ops_supervisor', 3),
('maintenance', 'ops_supervisor', 3),
('hvac', 'ops_supervisor', 3),
('electrical', 'ops_supervisor', 3),
('plumbing', 'ops_supervisor', 3)
ON CONFLICT (category, role) DO NOTHING;

-- Create RLS policies for new tables
CREATE POLICY "Staff can view task category roles" 
ON public.task_category_roles 
FOR SELECT 
USING (is_staff(auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage task category roles" 
ON public.task_category_roles 
FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view escalations" 
ON public.ticket_escalations 
FOR SELECT 
USING (is_staff(auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "System can create escalations" 
ON public.ticket_escalations 
FOR INSERT 
WITH CHECK (true);

-- Update RLS policies for new roles
-- Site managers can view/manage requests for their site
CREATE POLICY "Site managers can view their site requests"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'site_manager' AND
  -- For now, site_id logic will be added later when we implement site assignments
  (assigned_to = auth.uid() OR reported_by = auth.uid() OR is_staff(auth.uid()) OR is_admin(auth.uid()))
);

-- Tenant users can create requests
CREATE POLICY "Tenant users can create requests"
ON public.maintenance_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reported_by AND (
    (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved' OR
    is_admin(auth.uid()) OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('tenant_user', 'tenant_manager')
  )
);

-- Client readonly can view requests (read-only)
CREATE POLICY "Client readonly can view requests"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'client_readonly'
);

-- Update the enhanced auto-assignment function
CREATE OR REPLACE FUNCTION public.suggest_optimal_staff_assignment_v2(
  request_category TEXT,
  request_priority TEXT,
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
    target_roles := ARRAY['field_staff', 'facility_exec', 'site_manager', 'ops_supervisor']::app_role[];
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
      p.first_name || ' ' || p.last_name as name,
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

-- Create escalation function
CREATE OR REPLACE FUNCTION public.escalate_unaccepted_tickets()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  escalated_count INTEGER := 0;
  ticket_record RECORD;
  next_role app_role;
  target_staff_id UUID;
BEGIN
  -- Find tickets that need escalation (unaccepted for 30+ minutes)
  FOR ticket_record IN
    SELECT mr.id, mr.category_id, mr.priority, mr.assigned_to, p.role as current_role
    FROM maintenance_requests mr
    JOIN profiles p ON p.id = mr.assigned_to
    WHERE mr.status = 'pending'
      AND mr.created_at < NOW() - INTERVAL '30 minutes'
      AND mr.accepted_at IS NULL
  LOOP
    -- Get next role in escalation chain
    SELECT role INTO next_role
    FROM task_category_roles tcr
    WHERE tcr.category = ticket_record.category_id
      AND tcr.priority > (
        SELECT priority FROM task_category_roles 
        WHERE category = ticket_record.category_id 
        AND role = ticket_record.current_role
      )
    ORDER BY priority ASC
    LIMIT 1;
    
    -- If no next role found, escalate to ops_supervisor
    IF next_role IS NULL THEN
      next_role := 'ops_supervisor';
    END IF;
    
    -- Find available staff with the next role
    SELECT staff_id INTO target_staff_id
    FROM suggest_optimal_staff_assignment_v2(
      ticket_record.category_id,
      ticket_record.priority,
      NULL,
      ARRAY[ticket_record.assigned_to]
    )
    WHERE role = next_role::TEXT
    LIMIT 1;
    
    -- If staff found, escalate
    IF target_staff_id IS NOT NULL THEN
      -- Log escalation
      INSERT INTO ticket_escalations (request_id, from_role, to_role)
      VALUES (ticket_record.id, ticket_record.current_role, next_role);
      
      -- Update ticket assignment
      UPDATE maintenance_requests 
      SET assigned_to = target_staff_id,
          updated_at = NOW()
      WHERE id = ticket_record.id;
      
      escalated_count := escalated_count + 1;
    END IF;
  END LOOP;
  
  RETURN escalated_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.suggest_optimal_staff_assignment_v2(TEXT, TEXT, TEXT, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.escalate_unaccepted_tickets() TO authenticated;
