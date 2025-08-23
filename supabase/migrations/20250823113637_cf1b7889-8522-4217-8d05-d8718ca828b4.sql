-- Fix: Clear and populate SLA configs with proper enum casting
DELETE FROM sla_configs;

-- Insert SLA configs with proper casting
INSERT INTO sla_configs (category_id, priority, response_time_minutes, resolution_time_minutes) VALUES
-- For each main category, create configs for all priorities
((SELECT id FROM main_categories WHERE name ILIKE '%electrical%' LIMIT 1), 'urgent'::request_priority, 5, 120),
((SELECT id FROM main_categories WHERE name ILIKE '%electrical%' LIMIT 1), 'high'::request_priority, 15, 240),
((SELECT id FROM main_categories WHERE name ILIKE '%electrical%' LIMIT 1), 'medium'::request_priority, 60, 720),
((SELECT id FROM main_categories WHERE name ILIKE '%electrical%' LIMIT 1), 'low'::request_priority, 240, 2880),

((SELECT id FROM main_categories WHERE name ILIKE '%plumbing%' LIMIT 1), 'urgent'::request_priority, 5, 120),
((SELECT id FROM main_categories WHERE name ILIKE '%plumbing%' LIMIT 1), 'high'::request_priority, 15, 240),
((SELECT id FROM main_categories WHERE name ILIKE '%plumbing%' LIMIT 1), 'medium'::request_priority, 60, 720),
((SELECT id FROM main_categories WHERE name ILIKE '%plumbing%' LIMIT 1), 'low'::request_priority, 240, 2880),

((SELECT id FROM main_categories WHERE name ILIKE '%hvac%' LIMIT 1), 'urgent'::request_priority, 5, 120),
((SELECT id FROM main_categories WHERE name ILIKE '%hvac%' LIMIT 1), 'high'::request_priority, 15, 240),
((SELECT id FROM main_categories WHERE name ILIKE '%hvac%' LIMIT 1), 'medium'::request_priority, 60, 720),
((SELECT id FROM main_categories WHERE name ILIKE '%hvac%' LIMIT 1), 'low'::request_priority, 240, 2880),

((SELECT id FROM main_categories WHERE name ILIKE '%security%' LIMIT 1), 'urgent'::request_priority, 5, 120),
((SELECT id FROM main_categories WHERE name ILIKE '%security%' LIMIT 1), 'high'::request_priority, 15, 240),
((SELECT id FROM main_categories WHERE name ILIKE '%security%' LIMIT 1), 'medium'::request_priority, 60, 720),
((SELECT id FROM main_categories WHERE name ILIKE '%security%' LIMIT 1), 'low'::request_priority, 240, 2880);

-- Update sub_categories to match
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