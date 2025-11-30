-- Unschedule the useless assignment-orchestrator cron job
-- This job has been calling the edge function every minute with missing parameters
-- causing 1,440 failed invocations per day and wasting edge function quota

SELECT cron.unschedule('assignment-orchestrator-job');

-- Log the action for audit purposes
COMMENT ON EXTENSION pg_cron IS 'Disabled assignment-orchestrator-job on 2025-11-30 due to missing required parameters causing 100% failure rate';