-- Fix SLA escalation rules issue by creating the missing table and updating functions

-- Create the missing sla_escalation_rules table that functions are expecting
CREATE TABLE IF NOT EXISTS public.sla_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority TEXT NOT NULL,
  category_filter TEXT,
  target_minutes INTEGER NOT NULL,
  escalation_level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sla_escalation_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can view SLA escalation rules" 
ON public.sla_escalation_rules 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage SLA escalation rules" 
ON public.sla_escalation_rules 
FOR ALL 
USING (is_admin(auth.uid()));

-- Populate with default escalation rules based on existing sla_configs data
INSERT INTO public.sla_escalation_rules (priority, category_filter, target_minutes)
SELECT DISTINCT 
  priority,
  category as category_filter,
  resolution_time_minutes as target_minutes
FROM public.sla_configs
WHERE is_active = true
ON CONFLICT DO NOTHING;

-- Add some default escalation rules if none exist
INSERT INTO public.sla_escalation_rules (priority, category_filter, target_minutes) VALUES
('urgent', NULL, 60),
('high', NULL, 240),
('medium', NULL, 480),
('low', NULL, 1440)
ON CONFLICT DO NOTHING;

-- Update the set_request_sla function to handle the trigger properly
CREATE OR REPLACE FUNCTION public.set_request_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    sla_minutes INTEGER;
BEGIN
    -- Get SLA target based on priority and category
    SELECT target_minutes INTO sla_minutes
    FROM sla_escalation_rules
    WHERE priority = NEW.priority::text
    AND (category_filter IS NULL OR category_filter = NEW.category_id::text)
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
$$;

-- Ensure the trigger exists on maintenance_requests
DROP TRIGGER IF EXISTS set_maintenance_request_sla ON maintenance_requests;
CREATE TRIGGER set_maintenance_request_sla
    BEFORE INSERT ON maintenance_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_request_sla();