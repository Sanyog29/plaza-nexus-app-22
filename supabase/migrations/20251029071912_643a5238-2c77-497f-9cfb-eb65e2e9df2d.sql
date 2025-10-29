-- =====================================================
-- Fix Security Issues from Performance Monitoring
-- Only fixing issues created by the previous migration
-- =====================================================

-- Fix WARN 5: Function search path must be set
DROP FUNCTION IF EXISTS public.analyze_query_performance();

CREATE OR REPLACE FUNCTION public.analyze_query_performance()
RETURNS TABLE(
  issue_type text,
  table_name text,
  recommendation text,
  impact text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  RETURN QUERY
  -- Find tables with high sequential scans
  SELECT 
    'HIGH_SEQ_SCANS'::text,
    relname::text,
    'Consider adding indexes for common WHERE clauses'::text,
    'HIGH'::text
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
    AND seq_scan > 1000
    AND seq_scan > idx_scan * 2
  
  UNION ALL
  
  -- Find unused indexes
  SELECT 
    'UNUSED_INDEX'::text,
    indexrelname::text,
    'Consider dropping this index - never used'::text,
    'LOW'::text
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND idx_scan = 0
    AND pg_relation_size(indexrelid) > 1024 * 1024 -- > 1MB
  
  UNION ALL
  
  -- Find bloated tables
  SELECT 
    'TABLE_BLOAT'::text,
    relname::text,
    'Run VACUUM ANALYZE to reclaim space'::text,
    'MEDIUM'::text
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
    AND n_dead_tup > 1000
    AND n_dead_tup::float / NULLIF(n_live_tup, 0) > 0.2;
END;
$$;

-- Fix ERROR 1-4: Security Definer Views should be Security Invoker
-- or should have proper grants. We'll use SECURITY INVOKER for monitoring views.

-- Recreate View 1: Query Performance Metrics (SECURITY INVOKER)
DROP VIEW IF EXISTS public.v_query_performance;
CREATE OR REPLACE VIEW public.v_query_performance
WITH (security_invoker = true) AS
SELECT 
  schemaname,
  relname as tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins + n_tup_upd + n_tup_del as modifications,
  CASE 
    WHEN seq_scan + idx_scan = 0 THEN 0
    ELSE ROUND(100.0 * idx_scan / NULLIF(seq_scan + idx_scan, 0), 2)
  END as index_usage_pct
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;

-- Recreate View 2: Index Health Check (SECURITY INVOKER)
DROP VIEW IF EXISTS public.v_index_health;
CREATE OR REPLACE VIEW public.v_index_health
WITH (security_invoker = true) AS
SELECT 
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 100 THEN 'RARELY_USED'
    ELSE 'ACTIVE'
  END as usage_status
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- Recreate View 3: Table Statistics (SECURITY INVOKER)
DROP VIEW IF EXISTS public.v_table_stats;
CREATE OR REPLACE VIEW public.v_table_stats
WITH (security_invoker = true) AS
SELECT 
  schemaname,
  relname as tablename,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  CASE 
    WHEN n_live_tup > 0 
    THEN ROUND(100.0 * n_dead_tup / n_live_tup, 2)
    ELSE 0 
  END as bloat_pct,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Recreate View 4: Slow Query Indicators (SECURITY INVOKER)
DROP VIEW IF EXISTS public.v_slow_queries;
CREATE OR REPLACE VIEW public.v_slow_queries
WITH (security_invoker = true) AS
SELECT 
  schemaname,
  relname as tablename,
  seq_scan as sequential_scans,
  seq_tup_read as rows_read_sequentially,
  CASE 
    WHEN seq_scan > 0 
    THEN ROUND(seq_tup_read::numeric / seq_scan, 2)
    ELSE 0 
  END as avg_rows_per_scan,
  idx_scan as index_scans,
  n_live_tup as table_rows,
  CASE 
    WHEN seq_scan > 100 AND seq_scan > idx_scan 
    THEN 'NEEDS_INDEX'
    WHEN seq_tup_read > 1000000 
    THEN 'HIGH_VOLUME'
    ELSE 'OK'
  END as recommendation
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > 0
ORDER BY seq_tup_read DESC;

-- Grant necessary permissions on system catalog tables to authenticated users
-- This allows the views to work for all authenticated users
GRANT SELECT ON pg_stat_user_tables TO authenticated;
GRANT SELECT ON pg_stat_user_indexes TO authenticated;

-- Grant execute on the analysis function to authenticated users
GRANT EXECUTE ON FUNCTION public.analyze_query_performance() TO authenticated;