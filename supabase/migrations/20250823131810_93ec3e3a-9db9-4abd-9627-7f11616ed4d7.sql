-- Fix the set_request_sla trigger function to properly cast enum to text
CREATE OR REPLACE FUNCTION public.set_request_sla()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    sla_minutes INTEGER;
BEGIN
    -- Get SLA target based on priority and category
    SELECT target_minutes INTO sla_minutes
    FROM sla_escalation_rules
    WHERE priority = NEW.priority::text
    AND (category_filter IS NULL OR category_filter = NEW.main_category_id::text)
    AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no specific rule found, use default based on priority
    IF sla_minutes IS NULL THEN
        SELECT target_minutes INTO sla_minutes
        FROM sla_escalation_rules
        WHERE priority = NEW.priority::text
        AND category_filter IS NULL
        AND is_active = true
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;
    
    -- Set SLA breach time if we have a target
    IF sla_minutes IS NOT NULL THEN
        NEW.sla_breach_at := NOW() + (sla_minutes * INTERVAL '1 minute');
    END IF;
    
    -- Auto-assign to ops supervisor if no assignment
    IF NEW.assigned_to IS NULL THEN
        SELECT id INTO NEW.assigned_to
        FROM profiles
        WHERE role = 'ops_supervisor'
        ORDER BY created_at
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$function$;