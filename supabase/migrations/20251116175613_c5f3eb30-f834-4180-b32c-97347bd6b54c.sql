-- Add property_id column to analytics_summaries
ALTER TABLE analytics_summaries 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id);

CREATE INDEX IF NOT EXISTS idx_analytics_summaries_property_id 
ON analytics_summaries(property_id);

CREATE INDEX IF NOT EXISTS idx_analytics_summaries_property_date 
ON analytics_summaries(property_id, summary_date DESC);

-- Create property-scoped analytics function
CREATE OR REPLACE FUNCTION get_property_requests_metrics(
  _property_id UUID,
  _start_date TIMESTAMPTZ,
  _end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_requests BIGINT,
  active_requests BIGINT,
  completed_requests BIGINT,
  pending_requests BIGINT,
  urgent_requests BIGINT,
  sla_breaches BIGINT,
  avg_response_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress', 'assigned')) as active_requests,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_requests,
    COUNT(*) FILTER (WHERE sla_breach_at IS NOT NULL AND sla_breach_at < NOW()) as sla_breaches,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) FILTER (WHERE completed_at IS NOT NULL) as avg_response_minutes
  FROM maintenance_requests
  WHERE property_id = _property_id
    AND created_at >= _start_date
    AND created_at <= _end_date
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create multi-property aggregated function (for super_admin)
CREATE OR REPLACE FUNCTION get_all_properties_requests_metrics(
  _start_date TIMESTAMPTZ,
  _end_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_requests BIGINT,
  active_requests BIGINT,
  completed_requests BIGINT,
  pending_requests BIGINT,
  urgent_requests BIGINT,
  sla_breaches BIGINT,
  avg_response_minutes NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress', 'assigned')) as active_requests,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_requests,
    COUNT(*) FILTER (WHERE sla_breach_at IS NOT NULL AND sla_breach_at < NOW()) as sla_breaches,
    AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) FILTER (WHERE completed_at IS NOT NULL) as avg_response_minutes
  FROM maintenance_requests
  WHERE created_at >= _start_date
    AND created_at <= _end_date
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;