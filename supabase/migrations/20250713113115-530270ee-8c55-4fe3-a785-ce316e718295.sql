-- Insert sample rooms
INSERT INTO rooms (name, description, location, capacity, facilities, image_url) VALUES
('Conference Room A', 'Large conference room with video conferencing', 'Building A - 1st Floor', 12, ARRAY['projector', 'whiteboard', 'video_conference', 'wifi'], NULL),
('Meeting Room B1', 'Small meeting room for team discussions', 'Building B - 2nd Floor', 6, ARRAY['whiteboard', 'wifi', 'phone'], NULL),
('Executive Boardroom', 'Premium boardroom with city view', 'Building A - 10th Floor', 20, ARRAY['projector', 'video_conference', 'catering', 'wifi', 'city_view'], NULL),
('Training Room C', 'Training room with multimedia setup', 'Building C - 3rd Floor', 30, ARRAY['projector', 'microphone', 'wifi', 'whiteboard'], NULL),
('Huddle Space 1', 'Quick meeting space for small teams', 'Building A - 2nd Floor', 4, ARRAY['wifi', 'monitor'], NULL),
('Innovation Lab', 'Creative workspace with collaboration tools', 'Building B - 4th Floor', 15, ARRAY['smartboard', 'wifi', 'standing_desks', 'projector'], NULL)
ON CONFLICT DO NOTHING;

-- Insert sample hot desks
INSERT INTO hot_desks (desk_number, zone, floor, location_description, equipment_available, amenities, is_available) VALUES
('HD-A-001', 'Zone A', 'F1', 'Near the window with natural light', ARRAY['monitor', 'keyboard', 'mouse'], ARRAY['power_outlet', 'ethernet'], true),
('HD-A-002', 'Zone A', 'F1', 'Quiet corner desk', ARRAY['monitor', 'keyboard', 'mouse'], ARRAY['power_outlet', 'ethernet'], true),
('HD-B-001', 'Zone B', 'F2', 'Open area with collaboration space nearby', ARRAY['monitor', 'keyboard', 'mouse', 'webcam'], ARRAY['power_outlet', 'ethernet', 'printer_access'], false),
('HD-B-002', 'Zone B', 'F2', 'Standing desk option available', ARRAY['monitor', 'keyboard', 'mouse'], ARRAY['power_outlet', 'ethernet', 'standing_option'], true),
('HD-C-001', 'Zone C', 'F3', 'Executive area with premium amenities', ARRAY['dual_monitor', 'keyboard', 'mouse', 'webcam'], ARRAY['power_outlet', 'ethernet', 'coffee_station'], true)
ON CONFLICT DO NOTHING;