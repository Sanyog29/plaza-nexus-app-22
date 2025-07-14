-- Create shift schedules table for staff shift management
CREATE TABLE public.shift_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES profiles(id),
  shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_end TIMESTAMP WITH TIME ZONE NOT NULL,
  shift_type TEXT NOT NULL DEFAULT 'regular',
  status TEXT NOT NULL DEFAULT 'scheduled',
  break_start TIMESTAMP WITH TIME ZONE,
  break_end TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff skills table for training and assignment optimization
CREATE TABLE public.staff_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES profiles(id),
  skill_name TEXT NOT NULL,
  proficiency_level INTEGER NOT NULL CHECK (proficiency_level >= 1 AND proficiency_level <= 5),
  certified BOOLEAN NOT NULL DEFAULT false,
  certification_date DATE,
  certification_expiry DATE,
  training_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, skill_name)
);

-- Create training programs table
CREATE TABLE public.training_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_name TEXT NOT NULL,
  description TEXT,
  required_skills TEXT[] DEFAULT '{}',
  duration_hours INTEGER NOT NULL,
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  expiry_months INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff training progress table
CREATE TABLE public.staff_training_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES profiles(id),
  program_id UUID NOT NULL REFERENCES training_programs(id),
  status TEXT NOT NULL DEFAULT 'not_started',
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, program_id)
);

-- Create workload metrics table for load balancing
CREATE TABLE public.staff_workload_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES profiles(id),
  metric_date DATE NOT NULL,
  active_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  total_work_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  efficiency_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  availability_status TEXT NOT NULL DEFAULT 'available',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, metric_date)
);

-- Enable RLS
ALTER TABLE public.shift_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_workload_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shift_schedules
CREATE POLICY "Staff can view their own schedules" ON public.shift_schedules
  FOR SELECT USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Admins can manage all schedules" ON public.shift_schedules
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Supervisors can manage schedules" ON public.shift_schedules
  FOR ALL USING (is_staff(auth.uid()));

-- RLS Policies for staff_skills
CREATE POLICY "Staff can view their own skills" ON public.staff_skills
  FOR SELECT USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can update their own skills" ON public.staff_skills
  FOR UPDATE USING (auth.uid() = staff_id);

CREATE POLICY "Admins can manage all skills" ON public.staff_skills
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for training_programs
CREATE POLICY "Anyone can view training programs" ON public.training_programs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage training programs" ON public.training_programs
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for staff_training_progress
CREATE POLICY "Staff can view their own progress" ON public.staff_training_progress
  FOR SELECT USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can update their own progress" ON public.staff_training_progress
  FOR UPDATE USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Admins can manage all training progress" ON public.staff_training_progress
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for staff_workload_metrics
CREATE POLICY "Staff can view their own workload" ON public.staff_workload_metrics
  FOR SELECT USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Admins can manage workload metrics" ON public.staff_workload_metrics
  FOR ALL USING (is_admin(auth.uid()));

-- Create function to calculate staff workload score
CREATE OR REPLACE FUNCTION public.calculate_staff_workload_score(target_staff_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  active_tasks INTEGER;
  total_hours DECIMAL;
  skill_factor DECIMAL;
  availability_factor DECIMAL;
  workload_score DECIMAL;
BEGIN
  -- Get active tasks count
  SELECT COUNT(*) INTO active_tasks
  FROM task_assignments 
  WHERE assigned_to = target_staff_id 
    AND status IN ('pending', 'in_progress');
  
  -- Get total work hours this week
  SELECT COALESCE(SUM(total_work_hours), 0) INTO total_hours
  FROM staff_workload_metrics 
  WHERE staff_id = target_staff_id 
    AND metric_date >= CURRENT_DATE - INTERVAL '7 days';
  
  -- Calculate skill factor (average proficiency)
  SELECT COALESCE(AVG(proficiency_level), 3) INTO skill_factor
  FROM staff_skills 
  WHERE staff_id = target_staff_id;
  
  -- Calculate availability factor
  SELECT CASE 
    WHEN availability_status = 'available' THEN 1.0
    WHEN availability_status = 'busy' THEN 0.5
    ELSE 0.1
  END INTO availability_factor
  FROM staff_workload_metrics 
  WHERE staff_id = target_staff_id 
    AND metric_date = CURRENT_DATE
  LIMIT 1;
  
  -- Calculate workload score (lower is better for assignment)
  workload_score := (active_tasks * 10) + (total_hours * 2) - (skill_factor * 5) + (100 * (1 - COALESCE(availability_factor, 1)));
  
  RETURN workload_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for intelligent task assignment
CREATE OR REPLACE FUNCTION public.suggest_optimal_staff_assignment(
  task_category TEXT,
  required_skills TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'medium'
) RETURNS TABLE(
  staff_id UUID,
  staff_name TEXT,
  workload_score DECIMAL,
  skill_match_percentage INTEGER,
  availability_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    CONCAT(p.first_name, ' ', p.last_name) as staff_name,
    public.calculate_staff_workload_score(p.id) as workload_score,
    CASE 
      WHEN array_length(required_skills, 1) = 0 THEN 100
      ELSE (
        SELECT COALESCE(
          (COUNT(*) FILTER (WHERE ss.skill_name = ANY(required_skills)) * 100 / array_length(required_skills, 1))::INTEGER,
          0
        )
        FROM staff_skills ss 
        WHERE ss.staff_id = p.id 
          AND ss.certified = true
      )
    END as skill_match_percentage,
    COALESCE(swm.availability_status, 'available') as availability_status
  FROM profiles p
  LEFT JOIN staff_workload_metrics swm ON p.id = swm.staff_id AND swm.metric_date = CURRENT_DATE
  WHERE p.role IN ('field_staff', 'ops_supervisor')
    AND p.approval_status = 'approved'
  ORDER BY 
    skill_match_percentage DESC,
    workload_score ASC,
    CASE availability_status 
      WHEN 'available' THEN 1 
      WHEN 'busy' THEN 2 
      ELSE 3 
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic workload calculation
CREATE OR REPLACE FUNCTION public.update_staff_workload_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.staff_workload_metrics (
    staff_id,
    metric_date,
    active_tasks,
    completed_tasks
  )
  SELECT 
    COALESCE(NEW.assigned_to, OLD.assigned_to),
    CURRENT_DATE,
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress')),
    COUNT(*) FILTER (WHERE status = 'completed')
  FROM task_assignments 
  WHERE assigned_to = COALESCE(NEW.assigned_to, OLD.assigned_to)
  GROUP BY assigned_to
  ON CONFLICT (staff_id, metric_date) 
  DO UPDATE SET
    active_tasks = EXCLUDED.active_tasks,
    completed_tasks = EXCLUDED.completed_tasks,
    calculated_at = now();
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workload_on_task_change
  AFTER INSERT OR UPDATE OR DELETE ON task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_staff_workload_metrics();