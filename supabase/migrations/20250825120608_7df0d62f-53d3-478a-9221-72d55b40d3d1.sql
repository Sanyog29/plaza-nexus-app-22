-- Fix unique constraint issues for ON CONFLICT clauses

-- First, deduplicate analytics_summaries table
DELETE FROM analytics_summaries a1 
USING analytics_summaries a2 
WHERE a1.id < a2.id 
  AND a1.summary_date = a2.summary_date 
  AND a1.summary_type = a2.summary_type 
  AND a1.metric_category = a2.metric_category;

-- Add unique constraint for analytics_summaries
ALTER TABLE analytics_summaries 
ADD CONSTRAINT analytics_summaries_unique_key 
UNIQUE (summary_date, summary_type, metric_category);

-- Deduplicate performance_metrics table
DELETE FROM performance_metrics a1 
USING performance_metrics a2 
WHERE a1.id < a2.id 
  AND a1.metric_date = a2.metric_date;

-- Add unique constraint for performance_metrics
ALTER TABLE performance_metrics 
ADD CONSTRAINT performance_metrics_unique_key 
UNIQUE (metric_date);

-- Deduplicate dietary_preferences table
DELETE FROM dietary_preferences a1 
USING dietary_preferences a2 
WHERE a1.id < a2.id 
  AND a1.user_id = a2.user_id;

-- Add unique constraint for dietary_preferences
ALTER TABLE dietary_preferences 
ADD CONSTRAINT dietary_preferences_unique_key 
UNIQUE (user_id);