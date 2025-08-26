-- Schedule the assignment orchestrator to run every minute
SELECT cron.schedule(
  'assignment-orchestrator-job',
  '* * * * *', -- Every minute
  $$
  SELECT
    net.http_post(
        url:='https://mukqpwinqhdfffdkthcg.supabase.co/functions/v1/assignment-orchestrator',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a3Fwd2lucWhkZmZmZGt0aGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjYxNTgsImV4cCI6MjA2MDE0MjE1OH0.CZaUCoWQhzktkm2ksDyyQbH4XW7RkjTSu5I3v88uNWs"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);