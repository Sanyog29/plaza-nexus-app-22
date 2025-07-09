
-- Phase 1: Complete Backend Integration - Missing Tables and Enhanced Features

-- 1. Bulk operations tracking
CREATE TABLE IF NOT EXISTS public.bulk_operations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_items integer NOT NULL DEFAULT 0,
  processed_items integer NOT NULL DEFAULT 0,
  failed_items integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  error_log jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 2. Bulk operation progress tracking
CREATE TABLE IF NOT EXISTS public.bulk_operation_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_id uuid REFERENCES bulk_operations(id) ON DELETE CASCADE,
  current_step integer NOT NULL,
  total_steps integer NOT NULL,
  step_description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Staff skills matrix for intelligent assignment
CREATE TABLE IF NOT EXISTS public.staff_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  skill_category text NOT NULL,
  skill_level integer NOT NULL CHECK (skill_level >= 1 AND skill_level <= 5),
  certified boolean DEFAULT false,
  certification_expiry date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(staff_id, skill_category)
);

-- 4. AI request categorization rules
CREATE TABLE IF NOT EXISTS public.request_categorization_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name text NOT NULL,
  keywords text[] NOT NULL,
  category_assignment text NOT NULL,
  priority_boost integer DEFAULT 0,
  confidence_threshold numeric(3,2) DEFAULT 0.5,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Staff workload analytics for optimization
CREATE TABLE IF NOT EXISTS public.staff_workload_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  analysis_date date NOT NULL,
  active_requests integer DEFAULT 0,
  completed_requests integer DEFAULT 0,
  avg_completion_time_hours numeric(8,2) DEFAULT 0,
  workload_score integer DEFAULT 0,
  efficiency_rating numeric(3,2) DEFAULT 0,
  overtime_hours numeric(5,2) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(staff_id, analysis_date)
);

-- 6. Predictive maintenance models
CREATE TABLE IF NOT EXISTS public.ml_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name text NOT NULL,
  model_type text NOT NULL,
  model_version text NOT NULL DEFAULT '1.0',
  training_data_range jsonb,
  accuracy_score numeric(5,4),
  model_parameters jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. Prediction logs for tracking ML performance
CREATE TABLE IF NOT EXISTS public.prediction_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id uuid REFERENCES ml_models(id),
  asset_id uuid REFERENCES assets(id),
  prediction_type text NOT NULL,
  predicted_value jsonb NOT NULL,
  confidence_score numeric(5,4),
  actual_outcome jsonb,
  prediction_date timestamp with time zone NOT NULL DEFAULT now(),
  outcome_date timestamp with time zone
);

-- 8. Tenant feedback system for customer satisfaction tracking
CREATE TABLE IF NOT EXISTS public.tenant_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid REFERENCES profiles(id),
  request_id uuid REFERENCES maintenance_requests(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  response_time_rating integer CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 9. Escalation prediction system
CREATE TABLE IF NOT EXISTS public.escalation_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES maintenance_requests(id),
  predicted_escalation_probability numeric(3,2) NOT NULL,
  risk_factors jsonb,
  recommended_actions jsonb,
  model_version text,
  prediction_date timestamp with time zone NOT NULL DEFAULT now(),
  actual_escalated boolean,
  escalation_date timestamp with time zone
);

-- 10. User performance scores (expand existing or create if missing)
CREATE TABLE IF NOT EXISTS public.user_performance_scores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  efficiency_score numeric(5,2) DEFAULT 0,
  quality_score numeric(5,2) DEFAULT 0,
  reliability_score numeric(5,2) DEFAULT 0,
  productivity_score numeric(5,2) DEFAULT 0,
  customer_satisfaction_score numeric(5,2) DEFAULT 0,
  total_tasks_completed integer DEFAULT 0,
  avg_response_time_hours numeric(8,2) DEFAULT 0,
  sla_compliance_rate numeric(5,2) DEFAULT 0,
  attendance_rate numeric(5,2) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric_date)
);

-- Enable RLS on all new tables
ALTER TABLE public.bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_operation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_workload_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_performance_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bulk operations
CREATE POLICY "Admins can manage bulk operations" ON public.bulk_operations FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view bulk operations" ON public.bulk_operations FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage bulk operation progress" ON public.bulk_operation_progress FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view bulk operation progress" ON public.bulk_operation_progress FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for staff skills
CREATE POLICY "Staff can view their skills" ON public.staff_skills FOR SELECT USING ((auth.uid() = staff_id) OR is_admin(auth.uid()));
CREATE POLICY "Staff can update their skills" ON public.staff_skills FOR ALL USING ((auth.uid() = staff_id) OR is_admin(auth.uid()));

-- RLS Policies for categorization rules
CREATE POLICY "Admins can manage categorization rules" ON public.request_categorization_rules FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view categorization rules" ON public.request_categorization_rules FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for workload analytics
CREATE POLICY "Admins can view workload analytics" ON public.staff_workload_analytics FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view their own analytics" ON public.staff_workload_analytics FOR SELECT USING (auth.uid() = staff_id);

-- RLS Policies for ML models
CREATE POLICY "Admins can manage ML models" ON public.ml_models FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view active models" ON public.ml_models FOR SELECT USING (is_staff(auth.uid()) AND is_active = true);

-- RLS Policies for prediction logs
CREATE POLICY "Admins can view prediction logs" ON public.prediction_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view asset predictions" ON public.prediction_logs FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for tenant feedback
CREATE POLICY "Tenants can create feedback" ON public.tenant_feedback FOR INSERT WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Tenants can view their feedback" ON public.tenant_feedback FOR SELECT USING (auth.uid() = tenant_id);
CREATE POLICY "Staff can view all feedback" ON public.tenant_feedback FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for escalation predictions
CREATE POLICY "Admins can view escalation predictions" ON public.escalation_predictions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view escalation predictions" ON public.escalation_predictions FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for user performance scores
CREATE POLICY "Users can view their own scores" ON public.user_performance_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all performance scores" ON public.user_performance_scores FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Staff supervisors can view team scores" ON public.user_performance_scores FOR SELECT USING (is_staff(auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON public.bulk_operations(status);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_created_by ON public.bulk_operations(created_by);
CREATE INDEX IF NOT EXISTS idx_staff_skills_staff_id ON public.staff_skills(staff_id);
CREATE INDEX IF NOT EXISTS idx_workload_analytics_staff_date ON public.staff_workload_analytics(staff_id, analysis_date);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_asset_id ON public.prediction_logs(asset_id);
CREATE INDEX IF NOT EXISTS idx_prediction_logs_model_id ON public.prediction_logs(model_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feedback_tenant_id ON public.tenant_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feedback_request_id ON public.tenant_feedback(request_id);
CREATE INDEX IF NOT EXISTS idx_escalation_predictions_request_id ON public.escalation_predictions(request_id);
CREATE INDEX IF NOT EXISTS idx_user_performance_scores_user_date ON public.user_performance_scores(user_id, metric_date);

-- Phase 2: Data Enhancement - Seed realistic data

-- Insert staff skills for existing staff members
INSERT INTO public.staff_skills (staff_id, skill_category, skill_level, certified, certification_expiry)
SELECT 
  p.id,
  skill,
  CASE 
    WHEN p.role = 'admin' THEN 5
    WHEN p.role = 'ops_supervisor' THEN 4 + (random() * 1)::integer
    ELSE 2 + (random() * 2)::integer
  END,
  random() > 0.3,
  CASE WHEN random() > 0.3 THEN (CURRENT_DATE + interval '1 year' * (1 + random() * 2)) ELSE NULL END
FROM profiles p
CROSS JOIN (
  SELECT unnest(ARRAY[
    'HVAC Systems', 'Electrical Work', 'Plumbing', 'Carpentry', 
    'Painting', 'Cleaning', 'Security Systems', 'Fire Safety',
    'Landscaping', 'IT Support', 'Emergency Response', 'Customer Service'
  ]) as skill
) skills
WHERE p.role IN ('admin', 'ops_supervisor', 'field_staff')
ON CONFLICT (staff_id, skill_category) DO NOTHING;

-- Insert AI categorization rules
INSERT INTO public.request_categorization_rules (rule_name, keywords, category_assignment, priority_boost, confidence_threshold)
VALUES 
  ('HVAC Emergency', ARRAY['air conditioning', 'heating', 'temperature', 'hot', 'cold', 'AC'], 'HVAC', 2, 0.8),
  ('Electrical Emergency', ARRAY['electrical', 'power', 'electricity', 'shock', 'sparks', 'outage'], 'Electrical', 3, 0.9),
  ('Plumbing Emergency', ARRAY['water', 'leak', 'pipe', 'toilet', 'drain', 'flood'], 'Plumbing', 2, 0.8),
  ('Security Issue', ARRAY['security', 'lock', 'access', 'card', 'door', 'alarm'], 'Security', 1, 0.7),
  ('Cleaning Request', ARRAY['clean', 'dirty', 'spill', 'trash', 'garbage', 'mess'], 'Cleaning', 0, 0.6);

-- Insert sample ML models
INSERT INTO public.ml_models (model_name, model_type, model_version, accuracy_score, model_parameters, is_active)
VALUES 
  ('Equipment Failure Predictor', 'classification', '2.1', 0.8450, '{"algorithm": "random_forest", "features": ["usage_hours", "maintenance_history", "age"]}', true),
  ('Request Priority Classifier', 'classification', '1.3', 0.9120, '{"algorithm": "gradient_boosting", "features": ["keywords", "location", "time_of_day"]}', true),
  ('Staff Workload Optimizer', 'regression', '1.0', 0.7800, '{"algorithm": "linear_regression", "features": ["current_tasks", "skill_match", "availability"]}', true);

-- Insert tenant feedback for recent requests
INSERT INTO public.tenant_feedback (tenant_id, request_id, rating, feedback_text, response_time_rating, quality_rating, communication_rating)
SELECT 
  mr.reported_by,
  mr.id,
  3 + (random() * 2)::integer,
  CASE (random() * 4)::integer
    WHEN 0 THEN 'Great service, very professional!'
    WHEN 1 THEN 'Could be faster, but good quality work.'
    WHEN 2 THEN 'Excellent communication throughout the process.'
    ELSE 'Satisfied with the resolution.'
  END,
  3 + (random() * 2)::integer,
  3 + (random() * 2)::integer,
  3 + (random() * 2)::integer
FROM maintenance_requests mr
WHERE mr.status = 'completed' 
AND mr.completed_at > CURRENT_DATE - interval '30 days'
AND random() > 0.3;

-- Insert escalation predictions for active requests
INSERT INTO public.escalation_predictions (request_id, predicted_escalation_probability, risk_factors, recommended_actions, model_version)
SELECT 
  mr.id,
  CASE 
    WHEN mr.priority = 'urgent' THEN 0.65 + (random() * 0.3)
    WHEN mr.priority = 'high' THEN 0.35 + (random() * 0.3)
    WHEN mr.priority = 'medium' THEN 0.15 + (random() * 0.2)
    ELSE 0.05 + (random() * 0.1)
  END,
  jsonb_build_object(
    'time_since_creation', extract(epoch from (now() - mr.created_at)) / 3600,
    'priority_level', mr.priority,
    'assigned_staff_workload', 'medium',
    'similar_request_history', 'positive'
  ),
  jsonb_build_array(
    'Monitor closely for SLA compliance',
    'Consider priority escalation',
    'Assign additional resources if needed'
  ),
  'v1.3'
FROM maintenance_requests mr
WHERE mr.status IN ('pending', 'in_progress');

-- Insert user performance scores for the last 30 days
INSERT INTO public.user_performance_scores (
  user_id, metric_date, efficiency_score, quality_score, reliability_score, 
  productivity_score, customer_satisfaction_score, total_tasks_completed,
  avg_response_time_hours, sla_compliance_rate, attendance_rate
)
SELECT 
  p.id,
  date_series.metric_date,
  70 + (random() * 30)::numeric(5,2),
  75 + (random() * 25)::numeric(5,2),
  80 + (random() * 20)::numeric(5,2),
  65 + (random() * 35)::numeric(5,2),
  85 + (random() * 15)::numeric(5,2),
  (1 + random() * 8)::integer,
  (2 + random() * 6)::numeric(8,2),
  (85 + random() * 15)::numeric(5,2),
  (90 + random() * 10)::numeric(5,2)
FROM profiles p
CROSS JOIN generate_series(CURRENT_DATE - interval '29 days', CURRENT_DATE, interval '1 day') AS date_series(metric_date)
WHERE p.role IN ('admin', 'ops_supervisor', 'field_staff')
ON CONFLICT (user_id, metric_date) DO NOTHING;

-- Update service_records table to have more realistic data
UPDATE public.service_records 
SET cost = 150 + (random() * 500)::numeric(10,2),
    service_rating = 3 + (random() * 2)::integer,
    issues_found = CASE (random() * 3)::integer
      WHEN 0 THEN 'Minor wear and tear detected'
      WHEN 1 THEN 'Filter replacement needed'
      ELSE 'All systems functioning normally'
    END,
    actions_taken = CASE (random() * 3)::integer
      WHEN 0 THEN 'Cleaned and lubricated components'
      WHEN 1 THEN 'Replaced worn parts'
      ELSE 'Performed routine maintenance'
    END
WHERE cost IS NULL OR cost = 0;
