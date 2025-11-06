-- ============================================================================
-- DATABASE CLEANUP SCHEDULER
-- ============================================================================
-- This SQL script sets up automatic database cleanup using pg_cron
-- 
-- What it does:
-- 1. Deletes audit logs older than 90 days
-- 2. Hard deletes soft-deleted maintenance requests older than 30 days
-- 3. Runs every Sunday at 2:00 AM (low-traffic hours)
--
-- Prerequisites:
-- - pg_cron extension must be enabled
-- - pg_net extension must be enabled
-- ============================================================================

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the database cleanup job
-- Runs every Sunday at 2:00 AM (cron format: minute hour day-of-month month day-of-week)
SELECT cron.schedule(
  'database-cleanup-job',           -- Job name
  '0 2 * * 0',                      -- Schedule: Every Sunday at 2:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://mukqpwinqhdfffdkthcg.supabase.co/functions/v1/database-cleanup',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a3Fwd2lucWhkZmZmZGt0aGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjYxNTgsImV4cCI6MjA2MDE0MjE1OH0.CZaUCoWQhzktkm2ksDyyQbH4XW7RkjTSu5I3v88uNWs"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- ============================================================================
-- ALTERNATIVE SCHEDULES (uncomment the one you prefer)
-- ============================================================================

-- Option 1: Run daily at 3:00 AM
-- SELECT cron.schedule(
--   'database-cleanup-job',
--   '0 3 * * *',                    -- Every day at 3:00 AM
--   $$ [same SQL as above] $$
-- );

-- Option 2: Run weekly on Monday at 1:00 AM
-- SELECT cron.schedule(
--   'database-cleanup-job',
--   '0 1 * * 1',                    -- Every Monday at 1:00 AM
--   $$ [same SQL as above] $$
-- );

-- Option 3: Run monthly on the 1st at 2:00 AM
-- SELECT cron.schedule(
--   'database-cleanup-job',
--   '0 2 1 * *',                    -- 1st of every month at 2:00 AM
--   $$ [same SQL as above] $$
-- );

-- ============================================================================
-- MANAGEMENT COMMANDS
-- ============================================================================

-- View all scheduled jobs
-- SELECT * FROM cron.job;

-- View job execution history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Unschedule the cleanup job (if needed)
-- SELECT cron.unschedule('database-cleanup-job');

-- Manually trigger the cleanup (for testing)
-- SELECT
--   net.http_post(
--       url:='https://mukqpwinqhdfffdkthcg.supabase.co/functions/v1/database-cleanup',
--       headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a3Fwd2lucWhkZmZmZGt0aGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjYxNTgsImV4cCI6MjA2MDE0MjE1OH0.CZaUCoWQhzktkm2ksDyyQbH4XW7RkjTSu5I3v88uNWs"}'::jsonb,
--       body:='{"manual_trigger": true}'::jsonb
--   ) as request_id;

-- ============================================================================
-- DIRECT SQL CLEANUP (Alternative approach - runs directly in database)
-- ============================================================================
-- If you prefer to run cleanup directly without an edge function:

-- SELECT cron.schedule(
--   'direct-database-cleanup',
--   '0 2 * * 0',                    -- Every Sunday at 2:00 AM
--   $$
--   BEGIN;
--     -- Delete audit logs older than 90 days
--     DELETE FROM public.audit_logs 
--     WHERE created_at < (NOW() - INTERVAL '90 days');
--     
--     -- Hard delete soft-deleted maintenance requests older than 30 days
--     DELETE FROM public.maintenance_requests 
--     WHERE deleted_at IS NOT NULL 
--       AND deleted_at < (NOW() - INTERVAL '30 days');
--   COMMIT;
--   $$
-- );

-- ============================================================================
-- MONITORING QUERIES
-- ============================================================================

-- Check how many audit logs would be deleted
-- SELECT COUNT(*) as audit_logs_to_delete
-- FROM public.audit_logs 
-- WHERE created_at < (NOW() - INTERVAL '90 days');

-- Check how many maintenance requests would be hard deleted
-- SELECT COUNT(*) as requests_to_delete
-- FROM public.maintenance_requests 
-- WHERE deleted_at IS NOT NULL 
--   AND deleted_at < (NOW() - INTERVAL '30 days');

-- View recent audit log sizes
-- SELECT 
--   DATE(created_at) as log_date,
--   COUNT(*) as entries,
--   pg_size_pretty(pg_total_relation_size('audit_logs')) as table_size
-- FROM public.audit_logs
-- WHERE created_at > (NOW() - INTERVAL '30 days')
-- GROUP BY DATE(created_at)
-- ORDER BY log_date DESC;
