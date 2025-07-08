-- Enhanced audit logging triggers and functions
CREATE OR REPLACE FUNCTION public.enhanced_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the change with enhanced metadata
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for enhanced audit logging
CREATE TRIGGER enhanced_audit_maintenance_requests
  AFTER INSERT OR UPDATE OR DELETE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_trigger();

CREATE TRIGGER enhanced_audit_assets
  AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_trigger();

CREATE TRIGGER enhanced_audit_profiles
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enhanced_audit_trigger();

-- Bulk operations table
CREATE TABLE public.bulk_operations (
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

-- Bulk operation progress tracking
CREATE TABLE public.bulk_operation_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_id uuid REFERENCES bulk_operations(id) ON DELETE CASCADE,
  current_step integer NOT NULL,
  total_steps integer NOT NULL,
  step_description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Service records for enhanced asset management
CREATE TABLE public.service_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  service_date date NOT NULL,
  performed_by text NOT NULL,
  performed_by_user_id uuid REFERENCES profiles(id),
  service_description text NOT NULL,
  issues_found text,
  actions_taken text,
  parts_replaced text,
  cost numeric(10,2),
  invoice_number text,
  invoice_url text,
  next_service_date date,
  warranty_extended_until date,
  service_rating integer CHECK (service_rating >= 1 AND service_rating <= 5),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Staff skills matrix for intelligent assignment
CREATE TABLE public.staff_skills (
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

-- AI request categorization rules
CREATE TABLE public.request_categorization_rules (
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

-- Workload analytics for staff optimization
CREATE TABLE public.staff_workload_analytics (
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

-- Predictive maintenance models
CREATE TABLE public.ml_models (
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

-- Prediction logs for tracking ML performance
CREATE TABLE public.prediction_logs (
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

-- Intelligent reporting system
CREATE TABLE public.intelligent_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_name text NOT NULL,
  report_type text NOT NULL,
  generated_by uuid REFERENCES profiles(id),
  report_data jsonb NOT NULL,
  insights jsonb,
  recommendations jsonb,
  action_items jsonb,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone
);

-- Enable RLS on all new tables
ALTER TABLE public.bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_operation_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_workload_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligent_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage bulk operations" ON public.bulk_operations FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view bulk operations" ON public.bulk_operations FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage bulk operation progress" ON public.bulk_operation_progress FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view bulk operation progress" ON public.bulk_operation_progress FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view service records" ON public.service_records FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can create service records" ON public.service_records FOR INSERT WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can view their skills" ON public.staff_skills FOR SELECT USING ((auth.uid() = staff_id) OR is_admin(auth.uid()));
CREATE POLICY "Staff can update their skills" ON public.staff_skills FOR ALL USING ((auth.uid() = staff_id) OR is_admin(auth.uid()));

CREATE POLICY "Admins can manage categorization rules" ON public.request_categorization_rules FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view categorization rules" ON public.request_categorization_rules FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can view workload analytics" ON public.staff_workload_analytics FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view their own analytics" ON public.staff_workload_analytics FOR SELECT USING (auth.uid() = staff_id);

CREATE POLICY "Admins can manage ML models" ON public.ml_models FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view active models" ON public.ml_models FOR SELECT USING (is_staff(auth.uid()) AND is_active = true);

CREATE POLICY "Admins can view prediction logs" ON public.prediction_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view asset predictions" ON public.prediction_logs FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage intelligent reports" ON public.intelligent_reports FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view reports" ON public.intelligent_reports FOR SELECT USING (is_staff(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_bulk_operations_status ON public.bulk_operations(status);
CREATE INDEX idx_bulk_operations_created_by ON public.bulk_operations(created_by);
CREATE INDEX idx_service_records_asset_id ON public.service_records(asset_id);
CREATE INDEX idx_service_records_date ON public.service_records(service_date);
CREATE INDEX idx_staff_skills_staff_id ON public.staff_skills(staff_id);
CREATE INDEX idx_workload_analytics_staff_date ON public.staff_workload_analytics(staff_id, analysis_date);
CREATE INDEX idx_prediction_logs_asset_id ON public.prediction_logs(asset_id);
CREATE INDEX idx_prediction_logs_model_id ON public.prediction_logs(model_id);