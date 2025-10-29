-- =====================================================
-- VALIDATED Database Performance Optimization v2
-- Fixed: Only apply deleted_at filters where column exists
-- =====================================================

-- =====================================================
-- PHASE 1: Add Missing Foreign Key Indexes
-- These improve JOIN performance significantly
-- =====================================================

-- Cafeteria Orders - Missing FK indexes (NO deleted_at column)
CREATE INDEX IF NOT EXISTS idx_cafeteria_orders_user 
  ON public.cafeteria_orders(user_id);

CREATE INDEX IF NOT EXISTS idx_cafeteria_orders_vendor 
  ON public.cafeteria_orders(vendor_id);

-- Loyalty System - Missing FK indexes  
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user 
  ON public.loyalty_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_vendor 
  ON public.loyalty_transactions(vendor_id);

-- Maintenance Requests - Critical missing indexes (HAS deleted_at)
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_assigned_to 
  ON public.maintenance_requests(assigned_to) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_reported_by 
  ON public.maintenance_requests(reported_by) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_building_area 
  ON public.maintenance_requests(building_area_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_building_floor 
  ON public.maintenance_requests(building_floor_id) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_process 
  ON public.maintenance_requests(process_id) 
  WHERE deleted_at IS NULL;

-- Request Comments - Missing FK index
CREATE INDEX IF NOT EXISTS idx_request_comments_user 
  ON public.request_comments(user_id);

-- Parking Requests - Missing FK indexes
CREATE INDEX IF NOT EXISTS idx_parking_requests_user 
  ON public.parking_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_parking_requests_visitor 
  ON public.parking_requests(visitor_id);

-- Profiles - Missing FK indexes
CREATE INDEX IF NOT EXISTS idx_profiles_approved_by 
  ON public.profiles(approved_by);

CREATE INDEX IF NOT EXISTS idx_profiles_supervisor 
  ON public.profiles(supervisor_id);

-- =====================================================
-- PHASE 2: Add Strategic Composite Indexes
-- For common query patterns identified in the app
-- =====================================================

-- Maintenance Requests - Most common query patterns
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status_priority_created 
  ON public.maintenance_requests(status, priority, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property_status 
  ON public.maintenance_requests(property_id, status, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_assigned_status 
  ON public.maintenance_requests(assigned_to, status) 
  WHERE deleted_at IS NULL AND assigned_to IS NOT NULL;

-- Cafeteria Orders - Common ordering queries
CREATE INDEX IF NOT EXISTS idx_cafeteria_orders_user_created 
  ON public.cafeteria_orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cafeteria_orders_status_created 
  ON public.cafeteria_orders(status, created_at DESC);

-- =====================================================
-- PHASE 3: Create Performance Monitoring Views
-- For database health tracking and optimization
-- =====================================================

-- View 1: Query Performance Metrics
CREATE OR REPLACE VIEW public.v_query_performance AS
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

-- View 2: Index Health Check
CREATE OR REPLACE VIEW public.v_index_health AS
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

-- View 3: Table Statistics
CREATE OR REPLACE VIEW public.v_table_stats AS
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

-- View 4: Slow Query Indicators
CREATE OR REPLACE VIEW public.v_slow_queries AS
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

-- =====================================================
-- PHASE 4: Performance Analysis Function
-- Callable function to get optimization recommendations
-- =====================================================

CREATE OR REPLACE FUNCTION public.analyze_query_performance()
RETURNS TABLE(
  issue_type text,
  table_name text,
  recommendation text,
  impact text
) 
LANGUAGE plpgsql
SECURITY DEFINER
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