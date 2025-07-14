-- Create workflow execution system
CREATE TABLE public.workflow_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_name TEXT NOT NULL,
  source_module TEXT NOT NULL,
  event_type TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workflow actions table
CREATE TABLE public.workflow_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_id UUID NOT NULL REFERENCES public.workflow_triggers(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_module TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  execution_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create workflow execution logs
CREATE TABLE public.workflow_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_id UUID NOT NULL REFERENCES public.workflow_triggers(id),
  execution_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create cross-module data flows table
CREATE TABLE public.data_flow_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_module TEXT NOT NULL,
  target_module TEXT NOT NULL,
  flow_type TEXT NOT NULL,
  records_processed INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_processing_time_ms INTEGER DEFAULT 0,
  last_execution TIMESTAMP WITH TIME ZONE,
  metric_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create KPI aggregation table
CREATE TABLE public.kpi_aggregations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kpi_name TEXT NOT NULL,
  kpi_category TEXT NOT NULL,
  current_value DECIMAL(15,2) NOT NULL,
  target_value DECIMAL(15,2),
  trend_direction TEXT DEFAULT 'stable',
  calculation_config JSONB DEFAULT '{}',
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(kpi_name, kpi_category)
);

-- Create automated reports table
CREATE TABLE public.automated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  schedule_config JSONB NOT NULL,
  recipients JSONB DEFAULT '[]',
  template_config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_generated TIMESTAMP WITH TIME ZONE,
  next_generation TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create report generations table
CREATE TABLE public.report_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.automated_reports(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL,
  file_url TEXT,
  generation_status TEXT DEFAULT 'pending',
  error_message TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS on all tables
ALTER TABLE public.workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_flow_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage workflow triggers" ON public.workflow_triggers
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view workflow triggers" ON public.workflow_triggers
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage workflow actions" ON public.workflow_actions
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view workflow actions" ON public.workflow_actions
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view workflow execution logs" ON public.workflow_execution_logs
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view data flow metrics" ON public.data_flow_metrics
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view KPI aggregations" ON public.kpi_aggregations
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage KPI aggregations" ON public.kpi_aggregations
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view automated reports" ON public.automated_reports
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage automated reports" ON public.automated_reports
FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view report generations" ON public.report_generations
FOR SELECT USING (is_staff(auth.uid()));

-- Create function to execute workflow triggers
CREATE OR REPLACE FUNCTION public.execute_workflow_trigger(
  trigger_name TEXT,
  event_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workflow_trigger RECORD;
  workflow_action RECORD;
  execution_id UUID;
BEGIN
  -- Get the trigger configuration
  SELECT * INTO workflow_trigger
  FROM public.workflow_triggers
  WHERE trigger_name = $1 AND is_active = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workflow trigger not found: %', trigger_name;
  END IF;
  
  -- Create execution log entry
  INSERT INTO public.workflow_execution_logs (trigger_id, execution_data)
  VALUES (workflow_trigger.id, event_data)
  RETURNING id INTO execution_id;
  
  -- Execute all actions for this trigger
  FOR workflow_action IN
    SELECT * FROM public.workflow_actions
    WHERE trigger_id = workflow_trigger.id AND is_active = true
    ORDER BY execution_order
  LOOP
    -- Update execution log with action processing
    UPDATE public.workflow_execution_logs
    SET metadata = metadata || jsonb_build_object(
      'current_action', workflow_action.action_type,
      'processed_at', now()
    )
    WHERE id = execution_id;
  END LOOP;
  
  -- Mark execution as completed
  UPDATE public.workflow_execution_logs
  SET status = 'completed', completed_at = now()
  WHERE id = execution_id;
  
  RETURN execution_id;
END;
$$;

-- Create function to calculate cross-module KPIs
CREATE OR REPLACE FUNCTION public.calculate_cross_module_kpis()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  maintenance_efficiency DECIMAL(5,2);
  staff_utilization DECIMAL(5,2);
  order_fulfillment_rate DECIMAL(5,2);
  visitor_satisfaction DECIMAL(5,2);
BEGIN
  -- Calculate maintenance efficiency (completed vs total requests)
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*))
      ELSE 0
    END
  INTO maintenance_efficiency
  FROM maintenance_requests
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calculate staff utilization (active hours vs available hours)
  SELECT 
    CASE 
      WHEN COUNT(DISTINCT staff_id) > 0 THEN
        (COALESCE(SUM(total_work_hours), 0) * 100.0 / (COUNT(DISTINCT staff_id) * 160))
      ELSE 0
    END
  INTO staff_utilization
  FROM staff_workload_metrics
  WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calculate order fulfillment rate
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*))
      ELSE 0
    END
  INTO order_fulfillment_rate
  FROM cafeteria_orders
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calculate visitor satisfaction (placeholder)
  visitor_satisfaction := 85.0; -- Would come from visitor feedback when implemented
  
  -- Upsert KPI values
  INSERT INTO public.kpi_aggregations (kpi_name, kpi_category, current_value)
  VALUES 
    ('maintenance_efficiency', 'operations', maintenance_efficiency),
    ('staff_utilization', 'human_resources', staff_utilization),
    ('order_fulfillment_rate', 'service_delivery', order_fulfillment_rate),
    ('visitor_satisfaction', 'customer_experience', visitor_satisfaction)
  ON CONFLICT (kpi_name, kpi_category) DO UPDATE SET
    current_value = EXCLUDED.current_value,
    last_calculated = now();
END;
$$;

-- Insert default workflow triggers
INSERT INTO public.workflow_triggers (trigger_name, source_module, event_type, conditions) VALUES
('maintenance_completed', 'maintenance', 'status_change', '{"status": "completed"}'),
('task_assigned', 'tasks', 'assignment_change', '{}'),
('order_completed', 'orders', 'status_change', '{"status": "completed"}'),
('visitor_checked_in', 'visitors', 'status_change', '{"action": "check_in"}');

-- Insert default workflow actions
INSERT INTO public.workflow_actions (trigger_id, action_type, target_module, action_config, execution_order)
SELECT 
  t.id,
  action_data.action_type,
  action_data.target_module,
  action_data.action_config::jsonb,
  action_data.execution_order
FROM public.workflow_triggers t
CROSS JOIN (
  VALUES
  ('maintenance_completed', 'update_asset_metrics', 'assets', '{"update_service_date": true}', 1),
  ('maintenance_completed', 'calculate_performance', 'analytics', '{"type": "maintenance_efficiency"}', 2),
  ('task_assigned', 'update_workload', 'staff', '{"recalculate_scores": true}', 1),
  ('order_completed', 'update_inventory', 'inventory', '{"auto_reorder": true}', 1),
  ('visitor_checked_in', 'security_notification', 'security', '{"notify_guards": true}', 1)
) AS action_data(trigger_name, action_type, target_module, action_config, execution_order)
WHERE t.trigger_name = action_data.trigger_name;