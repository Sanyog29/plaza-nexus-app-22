-- First, let's check what categories exist and create sample maintenance requests
-- Insert sample maintenance requests for testing
INSERT INTO maintenance_requests (
  title, 
  description, 
  priority, 
  status, 
  location, 
  reported_by,
  created_at,
  updated_at
) VALUES
  (
    'Broken AC in Conference Room A',
    'The air conditioning unit in Conference Room A is not working. Temperature is very high and affecting meetings.',
    'high',
    'pending',
    'Conference Room A, 3rd Floor',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '2 hours',
    now() - interval '2 hours'
  ),
  (
    'Leaking faucet in kitchen',
    'The kitchen faucet on the 2nd floor is continuously dripping. Needs immediate attention.',
    'medium',
    'in_progress',
    'Kitchen, 2nd Floor',
    '22222222-2222-2222-2222-222222222222',
    now() - interval '1 day',
    now() - interval '4 hours'
  ),
  (
    'Printer not responding',
    'The main printer in the IT department is showing error messages and not printing documents.',
    'low',
    'pending',
    'IT Department, 1st Floor',
    '55555555-5555-5555-5555-555555555555',
    now() - interval '30 minutes',
    now() - interval '30 minutes'
  ),
  (
    'Electrical outlet sparking',
    'Electrical outlet near workstation 15 is sparking intermittently. Safety concern.',
    'urgent',
    'pending',
    'Workstation 15, 2nd Floor',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '15 minutes',
    now() - interval '15 minutes'
  ),
  (
    'Coffee spill cleanup needed',
    'Large coffee spill in the main hallway that needs professional cleaning.',
    'medium',
    'completed',
    'Main Hallway, 1st Floor',
    '22222222-2222-2222-2222-222222222222',
    now() - interval '3 hours',
    now() - interval '1 hour'
  ),
  (
    'Door lock malfunction',
    'The electronic lock on the server room door is not working properly. Access is compromised.',
    'high',
    'in_progress',
    'Server Room, Basement',
    '55555555-5555-5555-5555-555555555555',
    now() - interval '6 hours',
    now() - interval '2 hours'
  ),
  (
    'Light bulb replacement',
    'Several light bulbs in the meeting room need replacement. Room is quite dim.',
    'low',
    'completed',
    'Meeting Room B, 4th Floor',
    '11111111-1111-1111-1111-111111111111',
    now() - interval '2 days',
    now() - interval '1 day'
  ),
  (
    'Wet floor safety hazard',
    'Water leak creating slippery surface near elevator. Immediate attention required.',
    'urgent',
    'in_progress',
    'Elevator Area, 2nd Floor',
    '22222222-2222-2222-2222-222222222222',
    now() - interval '45 minutes',
    now() - interval '30 minutes'
  );