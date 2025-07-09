-- Insert sample maintenance requests with proper handling of foreign keys
INSERT INTO maintenance_requests (
  title, 
  description, 
  priority, 
  status, 
  location, 
  category_id, 
  reported_by,
  created_at,
  updated_at
) 
SELECT 
  title,
  description,
  priority::request_priority,
  status::request_status,
  location,
  category_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles WHERE id = reported_by_id) 
    THEN reported_by_id 
    ELSE NULL 
  END as reported_by,
  created_at,
  updated_at
FROM (
  VALUES
    (
      'Broken AC in Conference Room A',
      'The air conditioning unit in Conference Room A is not working. Temperature is very high and affecting meetings.',
      'high',
      'pending',
      'Conference Room A, 3rd Floor',
      (SELECT id FROM categories WHERE name = 'HVAC' LIMIT 1),
      '11111111-1111-1111-1111-111111111111'::uuid,
      now() - interval '2 hours',
      now() - interval '2 hours'
    ),
    (
      'Leaking faucet in kitchen',
      'The kitchen faucet on the 2nd floor is continuously dripping. Needs immediate attention.',
      'medium',
      'in_progress',
      'Kitchen, 2nd Floor',
      (SELECT id FROM categories WHERE name = 'Plumbing' LIMIT 1),
      '22222222-2222-2222-2222-222222222222'::uuid,
      now() - interval '1 day',
      now() - interval '4 hours'
    ),
    (
      'Printer not responding',
      'The main printer in the IT department is showing error messages and not printing documents.',
      'low',
      'pending',
      'IT Department, 1st Floor',
      (SELECT id FROM categories WHERE name = 'IT Support' LIMIT 1),
      '55555555-5555-5555-5555-555555555555'::uuid,
      now() - interval '30 minutes',
      now() - interval '30 minutes'
    ),
    (
      'Electrical outlet sparking',
      'Electrical outlet near workstation 15 is sparking intermittently. Safety concern.',
      'urgent',
      'pending',
      'Workstation 15, 2nd Floor',
      (SELECT id FROM categories WHERE name = 'Electrical' LIMIT 1),
      '11111111-1111-1111-1111-111111111111'::uuid,
      now() - interval '15 minutes',
      now() - interval '15 minutes'
    ),
    (
      'Coffee spill cleanup needed',
      'Large coffee spill in the main hallway that needs professional cleaning.',
      'medium',
      'completed',
      'Main Hallway, 1st Floor',
      (SELECT id FROM categories WHERE name = 'Cleaning' LIMIT 1),
      '22222222-2222-2222-2222-222222222222'::uuid,
      now() - interval '3 hours',
      now() - interval '1 hour'
    ),
    (
      'Door lock malfunction',
      'The electronic lock on the server room door is not working properly. Access is compromised.',
      'high',
      'in_progress',
      'Server Room, Basement',
      (SELECT id FROM categories WHERE name = 'Security' LIMIT 1),
      '55555555-5555-5555-5555-555555555555'::uuid,
      now() - interval '6 hours',
      now() - interval '2 hours'
    ),
    (
      'Light bulb replacement',
      'Several light bulbs in the meeting room need replacement. Room is quite dim.',
      'low',
      'completed',
      'Meeting Room B, 4th Floor',
      (SELECT id FROM categories WHERE name = 'General Maintenance' LIMIT 1),
      '11111111-1111-1111-1111-111111111111'::uuid,
      now() - interval '2 days',
      now() - interval '1 day'
    ),
    (
      'Wet floor safety hazard',
      'Water leak creating slippery surface near elevator. Immediate attention required.',
      'urgent',
      'in_progress',
      'Elevator Area, 2nd Floor',
      (SELECT id FROM categories WHERE name = 'Safety' LIMIT 1),
      '22222222-2222-2222-2222-222222222222'::uuid,
      now() - interval '45 minutes',
      now() - interval '30 minutes'
    )
) AS sample_data(title, description, priority, status, location, category_id, reported_by_id, created_at, updated_at)
WHERE category_id IS NOT NULL;