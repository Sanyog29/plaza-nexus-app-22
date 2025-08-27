-- Step 3: Insert default data and create functions with RLS policies

-- Insert default SLA configurations
INSERT INTO sla_configurations (priority, response_time_minutes, resolution_time_hours, escalation_intervals_minutes) VALUES
('critical', 10, 2, '{5, 10, 15}'),
('high', 30, 4, '{10, 20, 30}'),
('medium', 60, 12, '{30, 60, 120}'),
('low', 120, 48, '{60, 120, 240}')
ON CONFLICT (priority) DO UPDATE SET
  response_time_minutes = EXCLUDED.response_time_minutes,
  resolution_time_hours = EXCLUDED.resolution_time_hours,
  escalation_intervals_minutes = EXCLUDED.escalation_intervals_minutes;

-- Insert default staff groups
INSERT INTO staff_groups (group_name, group_description, escalation_chain, response_sla_minutes, resolution_sla_hours) VALUES
('mst_field', 'MST & Field Staff - HVAC, Electrical, Plumbing, IT, Lifts, Building Services', 
 '["mst", "fe", "assistant_manager", "assistant_general_manager", "vp"]', 30, 24),
('housekeeping', 'Housekeeping & Cleaning, Pantry & F&B, Environment', 
 '["hk", "assistant_floor_manager", "assistant_manager", "assistant_general_manager", "vp"]', 20, 12),
('security', 'Security & Access Control, CCTV, Security Incidents', 
 '["se", "assistant_manager", "assistant_general_manager", "assistant_vice_president", "ceo"]', 15, 8)
ON CONFLICT (group_name) DO UPDATE SET
  group_description = EXCLUDED.group_description,
  escalation_chain = EXCLUDED.escalation_chain;

-- Insert crisis keywords
INSERT INTO crisis_keywords (keyword, category, severity_score, auto_escalate_to_level) VALUES
('fire', 'emergency', 10, 5),
('smoke', 'emergency', 9, 5),
('gas leak', 'emergency', 10, 5),
('power outage', 'critical', 8, 4),
('elevator stuck', 'emergency', 9, 5),
('flooding', 'emergency', 10, 5),
('security breach', 'emergency', 9, 5),
('medical emergency', 'emergency', 10, 5),
('system down', 'critical', 7, 4),
('no water', 'critical', 8, 4)
ON CONFLICT (keyword) DO NOTHING;

-- Create RLS policies for the new tables
CREATE POLICY "Staff can manage their own availability" ON staff_availability
  FOR ALL USING (staff_id = auth.uid());

CREATE POLICY "Staff can view all availability" ON staff_availability
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view staff groups" ON staff_groups
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view SLA configurations" ON sla_configurations
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view crisis keywords" ON crisis_keywords
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view assignment attempts" ON ticket_assignment_attempts
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "System can log assignment attempts" ON ticket_assignment_attempts
  FOR INSERT WITH CHECK (true);