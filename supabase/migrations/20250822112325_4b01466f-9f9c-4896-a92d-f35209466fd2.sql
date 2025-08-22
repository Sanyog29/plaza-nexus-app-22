-- Enable the required extensions for http requests and cron jobs
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a scheduled job to call our edge function every minute using pg_net
SELECT net.http_post(
    url := 'https://mukqpwinqhdfffdkthcg.supabase.co/functions/v1/booking-end-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a3Fwd2lucWhkZmZmZGt0aGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjYxNTgsImV4cCI6MjA2MDE0MjE1OH0.CZaUCoWQhzktkm2ksDyyQbH4XW7RkjTSu5I3v88uNWs"}'::jsonb,
    body := '{"scheduled": true}'::jsonb
) as initial_test;

-- Create a function to call the edge function
CREATE OR REPLACE FUNCTION call_booking_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://mukqpwinqhdfffdkthcg.supabase.co/functions/v1/booking-end-reminders',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11a3Fwd2lucWhkZmZmZGt0aGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NjYxNTgsImV4cCI6MjA2MDE0MjE1OH0.CZaUCoWQhzktkm2ksDyyQbH4XW7RkjTSu5I3v88uNWs"}'::jsonb,
        body := '{"scheduled": true}'::jsonb
    );
END;
$$;