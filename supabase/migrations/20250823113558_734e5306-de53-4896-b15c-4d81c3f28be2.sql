-- Fix 1: Update SLA configurations to match the requirements using main_category_id
-- First clear existing configs
DELETE FROM sla_configs;

-- Insert new SLA configs matching the matrix with all categories
INSERT INTO sla_configs (category_id, priority, response_time_minutes, resolution_time_minutes) 
SELECT 
  id as category_id,
  priority,
  CASE priority
    WHEN 'urgent' THEN 5    -- P1 Critical - 5m response
    WHEN 'high' THEN 15     -- P2 High - 15m response  
    WHEN 'medium' THEN 60   -- P3 Medium - 1h response
    WHEN 'low' THEN 240     -- P4 Low - 4h response
  END as response_time_minutes,
  CASE priority
    WHEN 'urgent' THEN 120  -- P1 Critical - 2h resolution
    WHEN 'high' THEN 240    -- P2 High - 4h resolution
    WHEN 'medium' THEN 720  -- P3 Medium - 12h resolution  
    WHEN 'low' THEN 2880    -- P4 Low - 48h resolution
  END as resolution_time_minutes
FROM main_categories 
CROSS JOIN (VALUES ('urgent'), ('high'), ('medium'), ('low')) AS priorities(priority)
WHERE is_active = true;

-- Fix 2: Update sub_categories to use updated SLA times matching the main categories
UPDATE sub_categories SET 
  response_sla_minutes = CASE default_priority
    WHEN 'urgent' THEN 5
    WHEN 'high' THEN 15
    WHEN 'medium' THEN 60
    WHEN 'low' THEN 240
  END,
  resolution_sla_minutes = CASE default_priority
    WHEN 'urgent' THEN 120
    WHEN 'high' THEN 240
    WHEN 'medium' THEN 720
    WHEN 'low' THEN 2880
  END
WHERE is_active = true;