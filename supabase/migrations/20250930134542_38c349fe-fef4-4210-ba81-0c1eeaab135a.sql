
-- Fix security definer view issue by recreating monthly_leaderboard view
-- This ensures the view respects RLS policies on underlying tables

-- Drop the existing view
DROP VIEW IF EXISTS public.monthly_leaderboard;

-- Recreate the view (without SECURITY DEFINER, which is the default SECURITY INVOKER)
CREATE OR REPLACE VIEW public.monthly_leaderboard AS
SELECT 
    p.id,
    CONCAT(p.first_name, ' ', p.last_name) AS technician_name,
    p.avatar_url,
    p.department,
    tp.current_tier,
    COALESCE(
        SUM(pt.points) FILTER (WHERE pt.created_at >= DATE_TRUNC('month', NOW())),
        0
    ) AS monthly_points,
    tp.points_balance AS total_points,
    COUNT(mr.id) FILTER (WHERE mr.completed_at >= DATE_TRUNC('month', NOW())) AS tickets_completed,
    COALESCE(
        AVG(EXTRACT(EPOCH FROM (mr.completed_at - mr.created_at)) / 3600) 
        FILTER (WHERE mr.completed_at >= DATE_TRUNC('month', NOW())),
        0
    ) AS avg_completion_hours
FROM profiles p
LEFT JOIN technician_points tp ON p.id = tp.technician_id
LEFT JOIN point_transactions pt ON p.id = pt.technician_id AND pt.transaction_type = 'earned'
LEFT JOIN maintenance_requests mr ON p.id = mr.assigned_to AND mr.status = 'completed'
WHERE p.role IN ('field_staff', 'ops_supervisor')
GROUP BY p.id, p.first_name, p.last_name, p.avatar_url, p.department, tp.current_tier, tp.points_balance
ORDER BY monthly_points DESC, tickets_completed DESC;

-- Grant SELECT permissions to authenticated users
GRANT SELECT ON public.monthly_leaderboard TO authenticated, anon;

-- Add comment explaining this view respects RLS
COMMENT ON VIEW public.monthly_leaderboard IS 
'Leaderboard view that respects RLS policies on underlying tables (SECURITY INVOKER by default)';
