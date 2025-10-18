-- Fix database functions to use user_roles table instead of profiles.role

-- Fix check_sla_breaches function
CREATE OR REPLACE FUNCTION public.check_sla_breaches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    request_record RECORD;
    escalation_rule RECORD;
    penalty_amount DECIMAL;
BEGIN
    FOR request_record IN 
        SELECT mr.*, 
               EXTRACT(EPOCH FROM (mr.sla_breach_at - NOW()))/60 as minutes_to_breach,
               EXTRACT(EPOCH FROM (NOW() - mr.sla_breach_at))/60 as minutes_past_breach
        FROM public.maintenance_requests mr
        WHERE mr.status NOT IN ('completed', 'cancelled')
        AND mr.sla_breach_at IS NOT NULL
    LOOP
        IF request_record.minutes_past_breach > 0 THEN
            SELECT amount INTO penalty_amount
            FROM public.service_penalty_matrix 
            WHERE category = 'sla_breach' 
            AND priority = request_record.priority::text;
            
            INSERT INTO public.escalation_logs (
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
                NULL,
                COALESCE(penalty_amount, 0),
                'SLA deadline exceeded',
                jsonb_build_object(
                    'minutes_past_breach', request_record.minutes_past_breach,
                    'original_sla', request_record.sla_breach_at,
                    'breach_time', NOW()
                )
            );
            
            -- Fixed: Use user_roles table instead of profiles.role
            INSERT INTO public.notifications (
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
            FROM public.profiles p 
            WHERE EXISTS (
                SELECT 1 FROM public.user_roles ur 
                WHERE ur.user_id = p.id 
                AND ur.role IN ('admin', 'ops_supervisor')
            );
            
        ELSIF request_record.minutes_to_breach BETWEEN 0 AND 30 THEN
            INSERT INTO public.notifications (
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
            FROM public.profiles p 
            WHERE EXISTS (
                SELECT 1 FROM public.user_roles ur 
                WHERE ur.user_id = p.id 
                AND ur.role IN ('admin', 'ops_supervisor')
            )
            LIMIT 1;
        END IF;
    END LOOP;
END;
$function$;

-- Recreate profiles_public view with role from user_roles table
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.office_number,
  p.phone_number,
  p.created_at,
  p.updated_at,
  p.avatar_url,
  p.floor,
  p.zone,
  p.department,
  p.approval_status,
  p.approved_by,
  p.approved_at,
  p.rejection_reason,
  p.profile_visibility,
  p.notification_preferences,
  p.bio,
  p.skills,
  p.interests,
  p.specialization,
  p.designation,
  p.supervisor_id,
  p.shift_start,
  p.shift_end,
  p.onboarding_date,
  p.is_active,
  p.mobile_number,
  p.assigned_role_title,
  p.email,
  p.user_category,
  ur.role  -- Get role from user_roles table
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id;