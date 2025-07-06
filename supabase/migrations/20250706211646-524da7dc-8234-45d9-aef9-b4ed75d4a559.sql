-- Create knowledge base for self-service portal
CREATE TABLE public.knowledge_base_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  estimated_time_minutes INTEGER NOT NULL DEFAULT 10,
  steps JSONB NOT NULL DEFAULT '[]',
  required_tools TEXT[] DEFAULT '{}',
  safety_warnings TEXT[] DEFAULT '{}',
  success_rate DECIMAL(5,2) DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  video_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user performance tracking table
CREATE TABLE public.user_performance_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  efficiency_score DECIMAL(5,2) DEFAULT 0,
  quality_score DECIMAL(5,2) DEFAULT 0,
  reliability_score DECIMAL(5,2) DEFAULT 0,
  productivity_score DECIMAL(5,2) DEFAULT 0,
  customer_satisfaction_score DECIMAL(5,2) DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(8,2) DEFAULT 0,
  sla_compliance_rate DECIMAL(5,2) DEFAULT 100,
  attendance_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, metric_date)
);

-- Create staff skills tracking table
CREATE TABLE public.staff_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level INTEGER NOT NULL CHECK (proficiency_level BETWEEN 1 AND 5),
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, skill_name)
);

-- Create shift change requests table
CREATE TABLE public.shift_change_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_shift_start TIMESTAMPTZ NOT NULL,
  original_shift_end TIMESTAMPTZ NOT NULL,
  requested_shift_start TIMESTAMPTZ NOT NULL,
  requested_shift_end TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create knowledge base usage tracking
CREATE TABLE public.knowledge_base_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES knowledge_base_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  success BOOLEAN,
  feedback_rating INTEGER CHECK (feedback_rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  escalated_to_maintenance BOOLEAN DEFAULT false,
  escalation_request_id UUID REFERENCES maintenance_requests(id)
);

-- Enable RLS for all new tables
ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_performance_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view active knowledge base articles" ON public.knowledge_base_articles
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage knowledge base articles" ON public.knowledge_base_articles
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view their own performance scores" ON public.user_performance_scores
  FOR SELECT USING (auth.uid() = user_id OR is_staff(auth.uid()));

CREATE POLICY "Admins can manage performance scores" ON public.user_performance_scores
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view their own skills" ON public.staff_skills
  FOR SELECT USING (auth.uid() = user_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can update their own skills" ON public.staff_skills
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create shift change requests" ON public.shift_change_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Users can view their own shift requests" ON public.shift_change_requests
  FOR SELECT USING (auth.uid() = requested_by OR is_staff(auth.uid()));

CREATE POLICY "Admins can review shift requests" ON public.shift_change_requests
  FOR UPDATE USING (is_admin(auth.uid()) OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'ops_supervisor');

CREATE POLICY "Users can track their knowledge base usage" ON public.knowledge_base_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage" ON public.knowledge_base_usage
  FOR SELECT USING (auth.uid() = user_id OR is_staff(auth.uid()));

-- Create function to calculate real-time performance scores
CREATE OR REPLACE FUNCTION public.calculate_user_performance_score(
  target_user_id UUID,
  score_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  performance_data JSONB;
  maintenance_metrics RECORD;
  attendance_metrics RECORD;
  task_metrics RECORD;
BEGIN
  -- Get maintenance request metrics
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
    COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) FILTER (WHERE status = 'completed'), 0) as avg_completion_hours,
    COUNT(*) FILTER (WHERE completed_at <= sla_breach_at OR (sla_breach_at IS NULL AND status = 'completed')) as sla_compliant,
    COUNT(*) FILTER (WHERE sla_breach_at < NOW() AND status != 'completed') as sla_breached
  INTO maintenance_metrics
  FROM maintenance_requests 
  WHERE assigned_to = target_user_id 
    AND created_at::DATE = score_date;

  -- Get attendance metrics
  SELECT 
    COUNT(*) as attendance_days,
    COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(check_out_time, NOW()) - check_in_time))/3600), 0) as total_hours
  INTO attendance_metrics
  FROM staff_attendance 
  WHERE staff_id = target_user_id 
    AND check_in_time::DATE = score_date;

  -- Get task completion metrics
  SELECT 
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE supervisor_approval = true) as approved_tasks
  INTO task_metrics
  FROM task_assignments 
  WHERE assigned_to = target_user_id 
    AND actual_completion::DATE = score_date;

  -- Calculate performance scores
  performance_data := jsonb_build_object(
    'efficiency_score', LEAST(100, GREATEST(0, 
      CASE 
        WHEN maintenance_metrics.total_requests > 0 
        THEN (maintenance_metrics.completed_requests::DECIMAL / maintenance_metrics.total_requests * 100)
        ELSE 85 
      END
    )),
    'quality_score', LEAST(100, GREATEST(0,
      CASE 
        WHEN task_metrics.total_tasks > 0 
        THEN (task_metrics.approved_tasks::DECIMAL / task_metrics.total_tasks * 100)
        ELSE 90
      END
    )),
    'reliability_score', LEAST(100, GREATEST(0,
      CASE 
        WHEN maintenance_metrics.total_requests > 0
        THEN ((maintenance_metrics.total_requests - maintenance_metrics.sla_breached)::DECIMAL / maintenance_metrics.total_requests * 100)
        ELSE 95
      END
    )),
    'productivity_score', LEAST(100, GREATEST(0,
      CASE 
        WHEN attendance_metrics.total_hours > 0
        THEN (maintenance_metrics.completed_requests::DECIMAL / attendance_metrics.total_hours * 20 + 50)
        ELSE 75
      END
    )),
    'customer_satisfaction_score', 88, -- Mock for now, would come from feedback
    'total_tasks_completed', COALESCE(maintenance_metrics.completed_requests, 0),
    'avg_response_time_hours', COALESCE(maintenance_metrics.avg_completion_hours, 0),
    'sla_compliance_rate', CASE 
      WHEN maintenance_metrics.total_requests > 0 
      THEN (maintenance_metrics.sla_compliant::DECIMAL / maintenance_metrics.total_requests * 100)
      ELSE 100 
    END,
    'attendance_rate', CASE 
      WHEN attendance_metrics.attendance_days > 0 THEN 100 
      ELSE 0 
    END
  );

  -- Upsert performance score
  INSERT INTO user_performance_scores (
    user_id, metric_date, efficiency_score, quality_score, reliability_score, 
    productivity_score, customer_satisfaction_score, total_tasks_completed,
    avg_response_time_hours, sla_compliance_rate, attendance_rate
  ) VALUES (
    target_user_id, score_date,
    (performance_data->>'efficiency_score')::DECIMAL,
    (performance_data->>'quality_score')::DECIMAL,
    (performance_data->>'reliability_score')::DECIMAL,
    (performance_data->>'productivity_score')::DECIMAL,
    (performance_data->>'customer_satisfaction_score')::DECIMAL,
    (performance_data->>'total_tasks_completed')::INTEGER,
    (performance_data->>'avg_response_time_hours')::DECIMAL,
    (performance_data->>'sla_compliance_rate')::DECIMAL,
    (performance_data->>'attendance_rate')::DECIMAL
  ) ON CONFLICT (user_id, metric_date) DO UPDATE SET
    efficiency_score = EXCLUDED.efficiency_score,
    quality_score = EXCLUDED.quality_score,
    reliability_score = EXCLUDED.reliability_score,
    productivity_score = EXCLUDED.productivity_score,
    customer_satisfaction_score = EXCLUDED.customer_satisfaction_score,
    total_tasks_completed = EXCLUDED.total_tasks_completed,
    avg_response_time_hours = EXCLUDED.avg_response_time_hours,
    sla_compliance_rate = EXCLUDED.sla_compliance_rate,
    attendance_rate = EXCLUDED.attendance_rate,
    updated_at = NOW();

  RETURN performance_data;
END;
$$;

-- Insert some sample knowledge base articles
INSERT INTO public.knowledge_base_articles (title, content, category, difficulty, estimated_time_minutes, steps, required_tools, safety_warnings, success_rate, times_used) VALUES
('Fix Flickering Light Bulb', 'Step-by-step guide to resolve flickering light issues', 'Electrical', 'easy', 5, 
 '[
   "Turn off the light switch and wait for bulb to cool",
   "Carefully unscrew the bulb counterclockwise", 
   "Check if bulb was loose in socket",
   "Screw bulb back in firmly but not overtight",
   "Turn light switch back on to test"
 ]', 
 '{}', 
 '["Always turn off power first", "Let bulb cool before handling"]', 
 85.0, 247),

('Unclog Slow Drain', 'Natural method to clear minor drain blockages', 'Plumbing', 'easy', 15,
 '[
   "Remove visible debris from drain opening",
   "Pour hot water down drain",
   "Mix 1/2 cup baking soda with 1/2 cup vinegar",
   "Pour mixture down drain and cover with plug",
   "Wait 15 minutes then flush with hot water"
 ]',
 '["Baking soda", "White vinegar", "Hot water", "Drain plug"]',
 '["Avoid mixing with other chemicals", "Use gloves when handling drain"]',
 78.0, 189),

('Reset Circuit Breaker', 'How to safely reset a tripped circuit breaker', 'Electrical', 'medium', 3,
 '[
   "Locate electrical panel/breaker box",
   "Identify tripped breaker (switch in middle position)",
   "Turn breaker fully OFF first",
   "Then turn breaker fully ON",  
   "Check if power is restored"
 ]',
 '["Flashlight if needed"]',
 '["Never touch with wet hands", "Do not force switches", "Call maintenance if it trips again"]',
 92.0, 156);

-- Create trigger for updating timestamps
CREATE TRIGGER update_knowledge_base_articles_updated_at
  BEFORE UPDATE ON public.knowledge_base_articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_performance_scores_updated_at
  BEFORE UPDATE ON public.user_performance_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_skills_updated_at
  BEFORE UPDATE ON public.staff_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shift_change_requests_updated_at
  BEFORE UPDATE ON public.shift_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();