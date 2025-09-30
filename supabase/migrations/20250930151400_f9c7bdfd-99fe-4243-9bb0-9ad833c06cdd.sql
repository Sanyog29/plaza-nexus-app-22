
-- Fix monthly_leaderboard view ownership issue
-- The view needs to be owned by a role that respects RLS policies

-- First, ensure the view exists and recreate it if needed with proper security context
DO $$ 
BEGIN
  -- Drop and recreate the view to ensure it uses SECURITY INVOKER (default)
  DROP VIEW IF EXISTS public.monthly_leaderboard CASCADE;
  
  CREATE VIEW public.monthly_leaderboard 
  WITH (security_invoker = true) AS
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

  -- Grant appropriate permissions
  GRANT SELECT ON public.monthly_leaderboard TO authenticated, anon;
  
  -- Add explanatory comment
  COMMENT ON VIEW public.monthly_leaderboard IS 
  'Leaderboard view with security_invoker=true to respect RLS policies of the querying user';
  
END $$;
