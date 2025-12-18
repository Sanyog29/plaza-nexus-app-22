-- Create function to get tickets reported by tenant and super_tenant roles
-- This is used by super_tenant users to see only tenant-related tickets

CREATE OR REPLACE FUNCTION get_tenant_tickets(
  p_property_id uuid DEFAULT NULL,
  p_status text[] DEFAULT NULL,
  p_priority text[] DEFAULT NULL,
  p_category_ids uuid[] DEFAULT NULL,
  p_assigned_to uuid DEFAULT NULL,
  p_date_start timestamptz DEFAULT NULL,
  p_date_end timestamptz DEFAULT NULL,
  p_limit integer DEFAULT 50,
  p_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  status text,
  priority text,
  category_id uuid,
  location text,
  reported_by uuid,
  assigned_to uuid,
  sla_breach_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  completed_at timestamptz,
  property_id uuid,
  deleted_at timestamptz,
  reporter_first_name text,
  reporter_last_name text,
  reporter_office_number text,
  assignee_first_name text,
  assignee_last_name text,
  total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_count bigint;
BEGIN
  -- First get total count for pagination
  SELECT COUNT(*)
  INTO v_total_count
  FROM maintenance_requests mr
  INNER JOIN user_roles ur ON mr.reported_by = ur.user_id
  WHERE ur.role IN ('tenant', 'super_tenant')
    AND mr.deleted_at IS NULL
    AND (p_property_id IS NULL OR mr.property_id = p_property_id)
    AND (p_status IS NULL OR mr.status = ANY(p_status))
    AND (p_priority IS NULL OR mr.priority = ANY(p_priority))
    AND (p_category_ids IS NULL OR mr.category_id = ANY(p_category_ids))
    AND (p_assigned_to IS NULL OR mr.assigned_to = p_assigned_to)
    AND (p_date_start IS NULL OR mr.created_at >= p_date_start)
    AND (p_date_end IS NULL OR mr.created_at <= p_date_end);

  -- Return results with joined profile data
  RETURN QUERY
  SELECT 
    mr.id,
    mr.title,
    mr.description,
    mr.status,
    mr.priority,
    mr.category_id,
    mr.location,
    mr.reported_by,
    mr.assigned_to,
    mr.sla_breach_at,
    mr.created_at,
    mr.updated_at,
    mr.completed_at,
    mr.property_id,
    mr.deleted_at,
    rp.first_name AS reporter_first_name,
    rp.last_name AS reporter_last_name,
    rp.office_number AS reporter_office_number,
    ap.first_name AS assignee_first_name,
    ap.last_name AS assignee_last_name,
    v_total_count AS total_count
  FROM maintenance_requests mr
  INNER JOIN user_roles ur ON mr.reported_by = ur.user_id
  LEFT JOIN profiles rp ON mr.reported_by = rp.id
  LEFT JOIN profiles ap ON mr.assigned_to = ap.id
  WHERE ur.role IN ('tenant', 'super_tenant')
    AND mr.deleted_at IS NULL
    AND (p_property_id IS NULL OR mr.property_id = p_property_id)
    AND (p_status IS NULL OR mr.status = ANY(p_status))
    AND (p_priority IS NULL OR mr.priority = ANY(p_priority))
    AND (p_category_ids IS NULL OR mr.category_id = ANY(p_category_ids))
    AND (p_assigned_to IS NULL OR mr.assigned_to = p_assigned_to)
    AND (p_date_start IS NULL OR mr.created_at >= p_date_start)
    AND (p_date_end IS NULL OR mr.created_at <= p_date_end)
  ORDER BY 
    CASE mr.priority 
      WHEN 'urgent' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'medium' THEN 3 
      WHEN 'low' THEN 4 
      ELSE 5 
    END,
    mr.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;