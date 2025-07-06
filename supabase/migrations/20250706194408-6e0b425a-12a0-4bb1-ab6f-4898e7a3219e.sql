-- Update roles and add SLA monitoring infrastructure
-- Update existing profiles to use new role system (already done in previous migration)

-- Create SLA monitoring and escalation engine
CREATE OR REPLACE FUNCTION public.check_sla_breaches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
            -- Calculate penalty
            SELECT amount INTO penalty_amount
            FROM service_penalty_matrix 
            WHERE category = 'sla_breach' 
            AND priority = request_record.priority;
            
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
$$;

-- Create function to auto-assign SLA targets
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
    WHERE priority = NEW.priority
    AND (category_filter IS NULL OR category_filter = NEW.category_id)
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Set SLA breach time
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

-- Create trigger for auto SLA assignment
DROP TRIGGER IF EXISTS set_maintenance_request_sla ON maintenance_requests;
CREATE TRIGGER set_maintenance_request_sla
    BEFORE INSERT ON maintenance_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_request_sla();

-- Create function for role-based permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    permissions JSONB;
BEGIN
    SELECT role INTO user_role FROM profiles WHERE id = user_id;
    
    permissions := CASE user_role
        WHEN 'admin' THEN jsonb_build_object(
            'can_manage_users', true,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', true,
            'can_view_analytics', true,
            'can_manage_vendors', true
        )
        WHEN 'ops_supervisor' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', true,
            'can_assign_requests', true,
            'can_configure_sla', false,
            'can_view_analytics', true,
            'can_manage_vendors', false
        )
        WHEN 'field_staff' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false
        )
        WHEN 'tenant_manager' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false
        )
        WHEN 'vendor' THEN jsonb_build_object(
            'can_manage_users', false,
            'can_view_all_requests', false,
            'can_assign_requests', false,
            'can_configure_sla', false,
            'can_view_analytics', false,
            'can_manage_vendors', false
        )
        ELSE jsonb_build_object()
    END;
    
    RETURN permissions;
END;
$$;