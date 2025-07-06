-- Insert sample knowledge base articles
INSERT INTO public.knowledge_base_articles (title, content, category, difficulty, estimated_time_minutes, steps, required_tools, safety_warnings, success_rate, times_used) VALUES
('Fix Flickering Light Bulb', 
 'Complete guide to diagnose and fix flickering light bulb issues. Most common causes are loose connections or failing bulb components.',
 'Electrical', 'easy', 5, 
 '["Turn off the light switch and wait for bulb to cool down", "Carefully unscrew the bulb counterclockwise", "Check if bulb was loose in socket", "Screw bulb back in firmly but not too tight", "Turn light switch back on to test", "If still flickering, replace the bulb"]',
 ARRAY['Replacement bulb (if needed)'],
 ARRAY['Always turn off power first', 'Let bulb cool before handling', 'Never touch hot bulbs with bare hands'],
 85.0, 247),

('Unclog Slow Drain',
 'Natural eco-friendly method to clear minor drain blockages using common household items. Works for most sink and shower drains.',
 'Plumbing', 'easy', 15,
 '["Remove visible debris from drain opening", "Pour hot water down drain to loosen buildup", "Mix 1/2 cup baking soda with 1/2 cup white vinegar", "Pour mixture down drain and cover with plug", "Wait 15 minutes for chemical reaction", "Flush with hot water and test drainage"]',
 ARRAY['Baking soda', 'White vinegar', 'Hot water', 'Drain plug or cloth'],
 ARRAY['Avoid mixing with other chemicals', 'Use gloves when handling drain debris', 'Ensure good ventilation'],
 78.0, 189),

('Reset Circuit Breaker',
 'Safe procedure to reset a tripped circuit breaker and restore power to affected areas. Important safety steps included.',
 'Electrical', 'medium', 3,
 '["Locate electrical panel/breaker box", "Identify tripped breaker (switch in middle position)", "Turn breaker fully OFF first", "Wait 30 seconds", "Turn breaker fully ON", "Check if power is restored", "If trips again immediately, contact maintenance"]',
 ARRAY['Flashlight (if needed)', 'Dry hands'],
 ARRAY['Never touch with wet hands', 'Do not force switches', 'Call maintenance if breaker trips repeatedly', 'Keep panel area clear'],
 92.0, 156),

('Clear Paper Jam in Printer',
 'Step-by-step guide to safely remove paper jams from office printers without damaging internal components.',
 'Office Equipment', 'easy', 8,
 '["Turn off printer and unplug power cord", "Open all accessible covers and trays", "Gently remove any visible paper", "Check for small paper pieces", "Close all covers and trays", "Plug in and turn on printer", "Run test print"]',
 ARRAY['Flashlight or phone light'],
 ARRAY['Never force stuck paper', 'Turn off power before opening covers', 'Be gentle with internal components'],
 91.0, 203),

('Adjust Thermostat Settings',
 'Guide to properly configure building thermostat for optimal comfort and energy efficiency.',
 'HVAC', 'easy', 5,
 '["Locate main thermostat panel", "Check current temperature and settings", "Press MENU or SETTINGS button", "Navigate to temperature settings", "Adjust heating/cooling setpoints", "Set schedule if available", "Save changes and exit menu"]',
 ARRAY['Building thermostat manual (if available)'],
 ARRAY['Make gradual temperature changes', 'Note original settings before changes', 'Contact maintenance for major adjustments'],
 88.0, 167);

-- Insert sample staff skills for existing users
INSERT INTO public.staff_skills (user_id, skill_name, proficiency_level)
SELECT 
  p.id,
  skill,
  FLOOR(RANDOM() * 3) + 3 -- Random proficiency between 3-5
FROM profiles p
CROSS JOIN UNNEST(ARRAY[
  'General Maintenance',
  'Electrical Work', 
  'Plumbing',
  'HVAC Systems',
  'Equipment Repair',
  'Safety Protocols',
  'Quality Control',
  'Customer Service'
]) AS skill
WHERE p.role IN ('field_staff', 'ops_supervisor', 'admin')
  AND RANDOM() > 0.3; -- Only assign ~70% of skills to each person