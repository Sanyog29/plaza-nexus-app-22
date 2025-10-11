-- Fix Business Hours: 8 AM - 8 PM, Monday-Sunday (12 hours/day, 7 days/week)

-- 1. Update add_business_hours function (fixed variable name conflict)
CREATE OR REPLACE FUNCTION public.add_business_hours(
  start_time TIMESTAMP WITH TIME ZONE, 
  hours_to_add INTEGER
)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  result_time TIMESTAMP WITH TIME ZONE;
  calc_time TIMESTAMP WITH TIME ZONE;  -- Changed from current_time to calc_time
  remaining_hours INTEGER;
  day_start TIME := '08:00:00';
  day_end TIME := '20:00:00';
  business_hours_per_day INTEGER := 12;
BEGIN
  calc_time := start_time;
  remaining_hours := hours_to_add;
  
  -- If start time is before 8 AM, move to 8 AM same day
  IF calc_time::TIME < day_start THEN
    calc_time := calc_time::DATE + day_start;
  -- If after 8 PM, move to next day 8 AM
  ELSIF calc_time::TIME >= day_end THEN
    calc_time := (calc_time::DATE + INTERVAL '1 day') + day_start;
  END IF;
  
  -- Operations run 7 days a week (no weekend exclusion)
  
  WHILE remaining_hours > 0 LOOP
    DECLARE
      hours_today INTEGER;
      end_of_day TIMESTAMP WITH TIME ZONE;
    BEGIN
      end_of_day := calc_time::DATE + day_end;
      hours_today := LEAST(
        remaining_hours,
        EXTRACT(EPOCH FROM (end_of_day - calc_time))/3600
      )::INTEGER;
      
      IF hours_today <= 0 THEN
        calc_time := (calc_time::DATE + INTERVAL '1 day') + day_start;
      ELSE
        calc_time := calc_time + (hours_today || ' hours')::INTERVAL;
        remaining_hours := remaining_hours - hours_today;
      END IF;
    END;
  END LOOP;
  
  RETURN calc_time;
END;
$$;

-- 2. Create calculate_business_hours function for elapsed time
CREATE OR REPLACE FUNCTION public.calculate_business_hours(
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
) 
RETURNS NUMERIC AS $$
DECLARE
  business_hours NUMERIC := 0;
  current_day DATE;
  day_start TIMESTAMPTZ;
  day_end TIMESTAMPTZ;
  working_start TIMESTAMPTZ;
  working_end TIMESTAMPTZ;
BEGIN
  FOR current_day IN 
    SELECT generate_series(start_time::DATE, end_time::DATE, '1 day'::interval)::DATE
  LOOP
    day_start := current_day + TIME '08:00';
    day_end := current_day + TIME '20:00';
    
    working_start := GREATEST(start_time, day_start);
    working_end := LEAST(end_time, day_end);
    
    IF working_end > working_start THEN
      business_hours := business_hours + 
        EXTRACT(EPOCH FROM (working_end - working_start)) / 3600;
    END IF;
  END LOOP;
  
  RETURN GREATEST(business_hours, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Update calculate_request_sla trigger
CREATE OR REPLACE FUNCTION public.calculate_request_sla()
RETURNS TRIGGER AS $$
DECLARE
  sla_hours INTEGER;
BEGIN
  SELECT 
    CASE NEW.priority::text
      WHEN 'urgent' THEN 2
      WHEN 'high' THEN 4
      WHEN 'medium' THEN 24
      WHEN 'low' THEN 72
      ELSE 24
    END INTO sla_hours;
  
  NEW.sla_breach_at := public.add_business_hours(NEW.created_at, sla_hours);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recalculate SLA for all open tickets
UPDATE maintenance_requests mr
SET 
  sla_breach_at = public.add_business_hours(
    mr.created_at, 
    CASE mr.priority::text
      WHEN 'urgent' THEN 2
      WHEN 'high' THEN 4
      WHEN 'medium' THEN 24
      WHEN 'low' THEN 72
      ELSE 24
    END
  ),
  updated_at = now()
WHERE mr.status IN ('pending', 'assigned', 'in_progress')
  AND mr.sla_breach_at IS NOT NULL;

-- 5. Detect historical breaches
INSERT INTO escalation_logs (
  request_id, escalation_type, penalty_amount,
  escalation_reason, metadata, created_at
)
SELECT 
  mr.id,
  'sla_breach',
  COALESCE(spm.amount, 0),
  'SLA breach detected after business hours correction (8 AM-8 PM, 7 days)',
  jsonb_build_object(
    'breach_detection', 'retroactive',
    'old_calculation', '10 AM-8 PM weekdays only',
    'new_calculation', '8 AM-8 PM 7 days/week',
    'completed_at', mr.completed_at,
    'corrected_sla_breach_at', public.add_business_hours(
      mr.created_at,
      CASE mr.priority::text
        WHEN 'urgent' THEN 2
        WHEN 'high' THEN 4
        WHEN 'medium' THEN 24
        WHEN 'low' THEN 72
      END
    ),
    'minutes_overdue', EXTRACT(EPOCH FROM (
      mr.completed_at - public.add_business_hours(
        mr.created_at,
        CASE mr.priority::text
          WHEN 'urgent' THEN 2
          WHEN 'high' THEN 4
          WHEN 'medium' THEN 24
          WHEN 'low' THEN 72
        END
      )
    )) / 60
  ),
  mr.completed_at
FROM maintenance_requests mr
LEFT JOIN service_penalty_matrix spm 
  ON spm.category = 'sla_breach' 
  AND spm.priority = mr.priority::text
WHERE mr.status = 'completed'
  AND mr.completed_at IS NOT NULL
  AND mr.completed_at > public.add_business_hours(
    mr.created_at,
    CASE mr.priority::text
      WHEN 'urgent' THEN 2
      WHEN 'high' THEN 4
      WHEN 'medium' THEN 24
      WHEN 'low' THEN 72
    END
  )
  AND NOT EXISTS (
    SELECT 1 FROM escalation_logs el
    WHERE el.request_id = mr.id
      AND el.escalation_type = 'sla_breach'
  );

-- 6. Update system settings
INSERT INTO system_settings (category, key, value, data_type, description)
VALUES 
  ('operations', 'business_hours_start', '"08:00"'::jsonb, 'time', 'Daily operations start time'),
  ('operations', 'business_hours_end', '"20:00"'::jsonb, 'time', 'Daily operations end time'),
  ('operations', 'business_hours_per_day', '12'::jsonb, 'number', 'Total business hours per day'),
  ('operations', 'working_days', '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]'::jsonb, 'array', 'Days facility operates (7 days/week)')
ON CONFLICT (category, key) DO UPDATE
SET 
  value = EXCLUDED.value, 
  data_type = EXCLUDED.data_type,
  description = EXCLUDED.description,
  updated_at = now();

-- 7. Auto-detect breaches on completion
CREATE OR REPLACE FUNCTION public.check_sla_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF NEW.completed_at > NEW.sla_breach_at THEN
      INSERT INTO escalation_logs (
        request_id, escalation_type, penalty_amount, 
        escalation_reason, metadata
      ) VALUES (
        NEW.id, 
        'sla_breach',
        (SELECT amount FROM service_penalty_matrix 
         WHERE category = 'sla_breach' AND priority = NEW.priority::text),
        'Ticket completed after SLA deadline',
        jsonb_build_object(
          'completed_at', NEW.completed_at,
          'sla_deadline', NEW.sla_breach_at,
          'minutes_overdue', EXTRACT(EPOCH FROM (NEW.completed_at - NEW.sla_breach_at))/60,
          'business_hours_config', '8 AM - 8 PM, 7 days/week'
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_completion_check_sla ON maintenance_requests;
CREATE TRIGGER on_completion_check_sla
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION check_sla_on_completion();