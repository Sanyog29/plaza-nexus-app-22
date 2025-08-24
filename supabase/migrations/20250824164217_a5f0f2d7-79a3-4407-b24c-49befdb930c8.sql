-- Fix SLA trigger functions to properly handle enum to text comparisons
-- Drop any legacy SLA triggers first
DROP TRIGGER IF EXISTS set_maintenance_request_sla ON public.maintenance_requests;

-- Update calculate_request_sla function to cast enum to text
CREATE OR REPLACE FUNCTION public.calculate_request_sla()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  sla_hours INTEGER;
  category_name TEXT;
BEGIN
  -- Get category name for SLA lookup
  SELECT mc.name INTO category_name
  FROM public.maintenance_categories mc
  WHERE mc.id = NEW.category_id;
  
  -- Get SLA hours based on priority (cast enum to text for comparison)
  SELECT 
    CASE NEW.priority::text
      WHEN 'critical' THEN 2
      WHEN 'high' THEN 4
      WHEN 'medium' THEN 24
      WHEN 'low' THEN 72
      ELSE 24
    END INTO sla_hours;
  
  -- Set SLA breach time
  NEW.sla_breach_at := NEW.created_at + (sla_hours || ' hours')::INTERVAL;
  
  RETURN NEW;
END;
$function$;

-- Update set_request_sla function to cast enum to text
CREATE OR REPLACE FUNCTION public.set_request_sla()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  sla_hours INTEGER;
BEGIN
  -- Get SLA hours based on priority (cast enum to text for comparison)
  SELECT 
    CASE NEW.priority::text
      WHEN 'critical' THEN 2
      WHEN 'high' THEN 4
      WHEN 'medium' THEN 24
      WHEN 'low' THEN 72
      ELSE 24
    END INTO sla_hours;
  
  -- Set SLA breach time
  NEW.sla_breach_at := NEW.created_at + (sla_hours || ' hours')::INTERVAL;
  
  RETURN NEW;
END;
$function$;

-- Update check_sla_breaches function to cast enum to text
CREATE OR REPLACE FUNCTION public.check_sla_breaches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    request_record RECORD;
    escalation_rule RECORD;
    penalty_amount DECIMAL;
BEGIN
    -- Process requests approaching or past SLA deadlines
    FOR request_record IN 
        SELECT mr.*, 
               EXTRACT(EPOCH FROM (mr.sla_breach_at - NOW()))/60 as minutes_to_breach,
               EXTRACT(EPOCH FROM (NOW() - mr.sla_breach_at))/60 as minutes_past_breach
        FROM maintenance_requests mr
        WHERE mr.status NOT IN ('completed', 'cancelled')
        AND mr.sla_breach_at IS NOT NULL
    LOOP
        -- Check if SLA is breached (past deadline)
        IF request_record.minutes_past_breach > 0 THEN
            -- Calculate penalty (cast enum to text for comparison)
            SELECT amount INTO penalty_amount
            FROM service_penalty_matrix 
            WHERE category = 'sla_breach' 
            AND priority = request_record.priority::text;
            
            -- Log escalation
            INSERT INTO escalation_logs (
                request_id, 
                escalation_type, 
                escalated_from, 
                escalated_to, 
                penalty_amount,
                escalation_reason,
                metadata
            ) VALUES (
                request_record.id,
                'sla_breach',
                request_record.assigned_to,
                NULL, -- Will be assigned based on escalation rules
                COALESCE(penalty_amount, 0),
                'SLA deadline exceeded',
                jsonb_build_object(
                    'minutes_past_breach', request_record.minutes_past_breach,
                    'original_sla', request_record.sla_breach_at,
                    'breach_time', NOW()
                )
            );
            
            -- Send notification (would integrate with email service)
            INSERT INTO notifications (
                user_id, 
                title, 
                message, 
                type, 
                action_url
            ) 
            SELECT 
                p.id,
                'SLA Breach Alert!',
                format('Request #%s has exceeded SLA by %s minutes. Penalty: $%s', 
                       request_record.id, 
                       ROUND(request_record.minutes_past_breach), 
                       COALESCE(penalty_amount, 0)),
                'critical',
                format('/requests/%s', request_record.id)
            FROM profiles p 
            WHERE p.role IN ('admin', 'ops_supervisor');
            
        -- Check if approaching SLA deadline (within 30 minutes)
        ELSIF request_record.minutes_to_breach BETWEEN 0 AND 30 THEN
            -- Create warning notification
            INSERT INTO notifications (
                user_id, 
                title, 
                message, 
                type, 
                action_url
            ) 
            SELECT 
                COALESCE(request_record.assigned_to, p.id),
                'SLA Warning',
                format('Request #%s will breach SLA in %s minutes!', 
                       request_record.id, 
                       ROUND(request_record.minutes_to_breach)),
                'warning',
                format('/requests/%s', request_record.id)
            FROM profiles p 
            WHERE p.role IN ('admin', 'ops_supervisor')
            LIMIT 1;
        END IF;
    END LOOP;
END;
$function$;

-- Ensure only the calculate_request_sla trigger is active
DROP TRIGGER IF EXISTS calculate_request_sla_trigger ON public.maintenance_requests;

CREATE TRIGGER calculate_request_sla_trigger
    BEFORE INSERT ON public.maintenance_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_request_sla();