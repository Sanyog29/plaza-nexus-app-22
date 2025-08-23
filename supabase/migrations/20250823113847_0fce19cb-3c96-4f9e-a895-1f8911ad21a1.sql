-- Fix the trigger functions to properly handle enum casting
-- This will resolve the submission error

-- Drop existing triggers
DROP TRIGGER IF EXISTS set_sla_breach_time_trigger ON maintenance_requests;
DROP TRIGGER IF EXISTS auto_assign_ticket_by_category_trigger ON maintenance_requests;

-- Update set_sla_breach_time function
CREATE OR REPLACE FUNCTION public.set_sla_breach_time()
RETURNS TRIGGER AS $$
DECLARE
  sla_config RECORD;
BEGIN
  -- Get the SLA config for this request's category and priority
  -- Using sub_category lookup since sla_configs table seems to reference wrong table
  SELECT response_sla_minutes, resolution_sla_minutes INTO sla_config
  FROM sub_categories 
  WHERE id = NEW.sub_category_id;
  
  -- If an SLA config exists, set the breach time
  IF FOUND THEN
    -- If the request status is changing to completed, don't update the SLA breach time
    IF (TG_OP = 'UPDATE' AND NEW.status::text = 'completed' AND OLD.status::text != 'completed') THEN
      NEW.sla_breach_at := OLD.sla_breach_at;
    ELSE
      -- For new requests or other updates, calculate the SLA breach time
      NEW.sla_breach_at := NOW() + (sla_config.resolution_sla_minutes * INTERVAL '1 minute');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update auto_assign function
CREATE OR REPLACE FUNCTION public.auto_assign_ticket_by_category()
RETURNS TRIGGER AS $$
DECLARE
  target_group_id UUID;
  available_staff_id UUID;
BEGIN
  -- Skip if already assigned or is update
  IF NEW.assigned_to IS NOT NULL OR TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;
  
  -- Get the target group for this category
  SELECT sg.id INTO target_group_id
  FROM public.staff_groups sg
  JOIN public.category_group_mappings cgm ON sg.id = cgm.group_id
  WHERE cgm.category_id = NEW.main_category_id
  LIMIT 1;
  
  -- Set the assigned group
  NEW.assigned_group := target_group_id;
  
  -- If crisis, escalate immediately
  IF NEW.is_crisis THEN
    NEW.escalation_level := 5;
    NEW.next_escalation_at := NOW() + INTERVAL '5 minutes';
    RETURN NEW;
  END IF;
  
  -- Find available L1 staff in the group
  SELECT p.id INTO available_staff_id
  FROM public.profiles p
  JOIN public.staff_group_assignments sga ON p.id = sga.staff_id
  JOIN public.staff_availability sa ON p.id = sa.staff_id
  WHERE sga.group_id = target_group_id
    AND sga.staff_level = 1
    AND sa.is_available = true
    AND sa.availability_status::text = 'available'
  ORDER BY RANDOM()
  LIMIT 1;
  
  -- Assign to available staff if found
  IF available_staff_id IS NOT NULL THEN
    NEW.assigned_to := available_staff_id;
    NEW.next_escalation_at := NOW() + INTERVAL '10 minutes'; -- 10 min to acknowledge
  ELSE
    -- No L1 available, escalate to L2
    NEW.escalation_level := 2;
    NEW.next_escalation_at := NOW() + INTERVAL '10 minutes';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-create the triggers
CREATE TRIGGER set_sla_breach_time_trigger
  BEFORE INSERT OR UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_sla_breach_time();

CREATE TRIGGER auto_assign_ticket_by_category_trigger
  BEFORE INSERT ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_ticket_by_category();