-- Create scheduled_reports table for automated report generation
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('daily_operations', 'weekly_performance', 'monthly_executive', 'sla_compliance', 'custom')),
  schedule_config JSONB NOT NULL, -- { cron: '0 8 * * *', timezone: 'Asia/Kolkata' }
  filter_config JSONB NOT NULL,   -- { date_range: 'last_7_days', categories: [], priorities: [] }
  recipients JSONB NOT NULL,       -- { emails: ['user@example.com'], notify_slack: true }
  export_formats TEXT[] NOT NULL DEFAULT ARRAY['pdf'], -- ['pdf', 'csv', 'excel', 'json']
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_generated_at TIMESTAMPTZ,
  next_generation_at TIMESTAMPTZ
);

-- Create report_history table to track generated reports
CREATE TABLE IF NOT EXISTS public.report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID REFERENCES public.scheduled_reports(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_url TEXT,
  file_size_bytes INTEGER,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'failed')),
  error_message TEXT,
  metrics_snapshot JSONB,
  filter_config JSONB,
  export_format TEXT NOT NULL
);

-- Create function to calculate advanced maintenance metrics
CREATE OR REPLACE FUNCTION public.calculate_advanced_metrics(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metrics JSONB;
  v_total_requests INTEGER;
  v_completed_requests INTEGER;
  v_sla_breaches INTEGER;
  v_avg_completion_hours NUMERIC;
  v_avg_first_response_minutes NUMERIC;
  v_reopened_tickets INTEGER;
  v_efficiency_score NUMERIC;
  v_cost_per_ticket NUMERIC;
BEGIN
  -- Calculate core metrics
  SELECT 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'completed') as completed,
    COUNT(*) FILTER (WHERE sla_breach_at < completed_at OR (sla_breach_at < NOW() AND status != 'completed')) as breached,
    COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) FILTER (WHERE status = 'completed'), 0) as avg_hours,
    COALESCE(AVG(EXTRACT(EPOCH FROM (assigned_at - created_at)) / 60) FILTER (WHERE assigned_at IS NOT NULL), 0) as avg_first_response
  INTO v_total_requests, v_completed_requests, v_sla_breaches, v_avg_completion_hours, v_avg_first_response_minutes
  FROM maintenance_requests
  WHERE created_at::DATE BETWEEN p_start_date AND p_end_date;
  
  -- Calculate reopened tickets (tickets that were completed then moved back to other status)
  SELECT COUNT(DISTINCT request_id)
  INTO v_reopened_tickets
  FROM request_status_history
  WHERE changed_at::DATE BETWEEN p_start_date AND p_end_date
    AND status = 'completed'
    AND EXISTS (
      SELECT 1 FROM request_status_history rsh2
      WHERE rsh2.request_id = request_status_history.request_id
        AND rsh2.changed_at > request_status_history.changed_at
        AND rsh2.status != 'completed'
    );
  
  -- Calculate efficiency score (0-100)
  -- Formula: (Completion Rate * 0.4) + (SLA Compliance * 0.4) + (Speed Score * 0.2)
  v_efficiency_score := CASE 
    WHEN v_total_requests > 0 THEN
      ((v_completed_requests::NUMERIC / v_total_requests * 100) * 0.4) +
      (((v_total_requests - v_sla_breaches)::NUMERIC / v_total_requests * 100) * 0.4) +
      (GREATEST(0, 100 - v_avg_completion_hours) * 0.2)
    ELSE 0
  END;
  
  -- Calculate average cost per ticket (using penalty amounts as proxy)
  SELECT COALESCE(AVG(penalty_amount), 0)
  INTO v_cost_per_ticket
  FROM escalation_logs
  WHERE created_at::DATE BETWEEN p_start_date AND p_end_date;
  
  -- Build comprehensive metrics JSON
  v_metrics := jsonb_build_object(
    'total_requests', v_total_requests,
    'completed_requests', v_completed_requests,
    'open_requests', v_total_requests - v_completed_requests,
    'completion_rate', CASE WHEN v_total_requests > 0 THEN ROUND((v_completed_requests::NUMERIC / v_total_requests * 100)::NUMERIC, 2) ELSE 0 END,
    'sla_breaches', v_sla_breaches,
    'sla_compliance_rate', CASE WHEN v_total_requests > 0 THEN ROUND(((v_total_requests - v_sla_breaches)::NUMERIC / v_total_requests * 100)::NUMERIC, 2) ELSE 0 END,
    'avg_completion_hours', ROUND(v_avg_completion_hours::NUMERIC, 2),
    'avg_first_response_minutes', ROUND(v_avg_first_response_minutes::NUMERIC, 2),
    'reopened_tickets', v_reopened_tickets,
    'reopened_rate', CASE WHEN v_completed_requests > 0 THEN ROUND((v_reopened_tickets::NUMERIC / v_completed_requests * 100)::NUMERIC, 2) ELSE 0 END,
    'efficiency_score', ROUND(v_efficiency_score::NUMERIC, 2),
    'avg_cost_per_ticket', ROUND(v_cost_per_ticket::NUMERIC, 2),
    'period_start', p_start_date,
    'period_end', p_end_date,
    'calculated_at', NOW()
  );
  
  RETURN v_metrics;
END;
$$;

-- Create function for comprehensive analytics with comparison
CREATE OR REPLACE FUNCTION public.generate_comprehensive_analytics(
  p_start_date DATE,
  p_end_date DATE,
  p_comparison_enabled BOOLEAN DEFAULT false
)
RETURNS TABLE (
  metric_category TEXT,
  current_period JSONB,
  previous_period JSONB,
  change_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_metrics JSONB;
  v_previous_metrics JSONB;
  v_period_length INTEGER;
  v_previous_start DATE;
  v_previous_end DATE;
BEGIN
  -- Calculate current period metrics
  v_current_metrics := calculate_advanced_metrics(p_start_date, p_end_date);
  
  IF p_comparison_enabled THEN
    -- Calculate period length and previous period dates
    v_period_length := p_end_date - p_start_date;
    v_previous_end := p_start_date - 1;
    v_previous_start := v_previous_end - v_period_length;
    
    -- Calculate previous period metrics
    v_previous_metrics := calculate_advanced_metrics(v_previous_start, v_previous_end);
  ELSE
    v_previous_metrics := NULL;
  END IF;
  
  -- Return maintenance metrics
  RETURN QUERY SELECT
    'maintenance'::TEXT,
    v_current_metrics,
    v_previous_metrics,
    CASE 
      WHEN p_comparison_enabled AND (v_previous_metrics->>'total_requests')::INTEGER > 0 THEN
        ROUND((((v_current_metrics->>'total_requests')::NUMERIC - (v_previous_metrics->>'total_requests')::NUMERIC) / (v_previous_metrics->>'total_requests')::NUMERIC * 100)::NUMERIC, 2)
      ELSE NULL
    END;
  
  -- Add more categories (staff, utility, etc.) as needed
  RETURN;
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_reports
CREATE POLICY "Admins can manage scheduled reports"
  ON public.scheduled_reports
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view scheduled reports"
  ON public.scheduled_reports
  FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

-- RLS Policies for report_history
CREATE POLICY "Admins can view all report history"
  ON public.report_history
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view report history"
  ON public.report_history
  FOR SELECT
  TO authenticated
  USING (is_staff(auth.uid()));

CREATE POLICY "System can create report history"
  ON public.report_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_generation 
  ON public.scheduled_reports(next_generation_at) 
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_report_history_generated_at 
  ON public.report_history(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_history_scheduled_report 
  ON public.report_history(scheduled_report_id);

-- Add updated_at trigger for scheduled_reports
CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();