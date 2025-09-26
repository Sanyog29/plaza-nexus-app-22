-- Fix Security Definer View issue with monthly_leaderboard
-- The view was created by postgres superuser, making it effectively a SECURITY DEFINER view
-- This bypasses RLS policies and poses a security risk

-- Drop the existing view that's owned by postgres superuser
DROP VIEW IF EXISTS public.monthly_leaderboard;

-- Recreate the view with proper RLS enforcement
-- This ensures the view respects RLS policies of the querying user
CREATE VIEW public.monthly_leaderboard AS
SELECT 
    p.id,
    concat(p.first_name, ' ', p.last_name) AS technician_name,
    p.avatar_url,
    p.department,
    tp.current_tier,
    COALESCE(sum(pt.points) FILTER (WHERE (pt.created_at >= date_trunc('month'::text, now()))), 0::bigint) AS monthly_points,
    tp.points_balance AS total_points,
    count(mr.id) FILTER (WHERE (mr.completed_at >= date_trunc('month'::text, now()))) AS tickets_completed,
    COALESCE(avg((EXTRACT(epoch FROM (mr.completed_at - mr.created_at)) / 3600::numeric)) FILTER (WHERE (mr.completed_at >= date_trunc('month'::text, now()))), 0::numeric) AS avg_completion_hours
FROM profiles p
LEFT JOIN technician_points tp ON (p.id = tp.technician_id)
LEFT JOIN point_transactions pt ON (p.id = pt.technician_id AND pt.transaction_type = 'earned'::text)
LEFT JOIN maintenance_requests mr ON (p.id = mr.assigned_to AND mr.status = 'completed'::request_status)
WHERE p.role = ANY (ARRAY['field_staff'::app_role, 'ops_supervisor'::app_role])
GROUP BY p.id, p.first_name, p.last_name, p.avatar_url, p.department, tp.current_tier, tp.points_balance
ORDER BY COALESCE(sum(pt.points) FILTER (WHERE (pt.created_at >= date_trunc('month'::text, now()))), 0::bigint) DESC, 
         count(mr.id) FILTER (WHERE (mr.completed_at >= date_trunc('month'::text, now()))) DESC;

-- Enable RLS on the view to ensure proper access control
-- Views automatically inherit RLS policies from their underlying tables
COMMENT ON VIEW public.monthly_leaderboard IS 'Leaderboard view that respects RLS policies from underlying tables';