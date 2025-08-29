-- Fix the calculate_user_performance_score function with proper constraint handling
CREATE OR REPLACE FUNCTION public.calculate_user_performance_score(target_user_id uuid, score_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    'customer_satisfaction_score', 88,
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

  -- Use explicit constraint name in ON CONFLICT
  INSERT INTO public.user_performance_scores (
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
  ) 
  ON CONFLICT ON CONSTRAINT user_performance_scores_user_id_metric_date_key 
  DO UPDATE SET
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