-- Create function to get recent SLA breaches
CREATE OR REPLACE FUNCTION public.get_recent_sla_breaches(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
    id UUID,
    request_id UUID,
    escalation_type TEXT,
    penalty_amount DECIMAL,
    escalation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    request_title TEXT,
    request_priority TEXT,
    request_status TEXT,
    request_sla_breach_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        el.id,
        el.request_id,
        el.escalation_type,
        el.penalty_amount,
        el.escalation_reason,
        el.created_at,
        el.metadata,
        mr.title as request_title,
        mr.priority::TEXT as request_priority,
        mr.status::TEXT as request_status,
        mr.sla_breach_at as request_sla_breach_at
    FROM escalation_logs el
    JOIN maintenance_requests mr ON el.request_id = mr.id
    WHERE el.created_at >= (NOW() - (days_back || ' days')::INTERVAL)
    ORDER BY el.created_at DESC;
END;
$$;