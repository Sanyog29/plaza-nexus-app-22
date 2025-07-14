-- Insert sample optimization recommendations for testing
INSERT INTO optimization_recommendations (
  title, 
  description, 
  recommendation_type, 
  priority, 
  potential_savings, 
  confidence_score,
  implementation_effort,
  metadata
) VALUES 
(
  'Optimize HVAC Schedule Based on Occupancy', 
  'Reduce HVAC runtime during low-occupancy hours to save energy costs', 
  'energy_optimization', 
  'high', 
  2500.00, 
  0.85,
  'medium',
  '{"affected_systems": ["HVAC", "Building Management"], "estimated_implementation_days": 14}'::jsonb
),
(
  'Predictive Maintenance for Elevator System', 
  'Schedule proactive maintenance based on usage patterns to prevent failures', 
  'maintenance_optimization', 
  'medium', 
  5000.00, 
  0.92,
  'low',
  '{"asset_ids": ["elevator-001"], "maintenance_type": "predictive", "risk_reduction": "75%"}'::jsonb
),
(
  'Resource Allocation Optimization', 
  'Redistribute cleaning staff based on real-time usage analytics', 
  'resource_optimization', 
  'medium', 
  1800.00, 
  0.78,
  'high',
  '{"departments": ["Facilities", "Operations"], "staff_impact": 3}'::jsonb
);

-- Insert sample IoT sensor data for testing
INSERT INTO iot_sensor_data (
  device_id,
  sensor_type,
  location,
  reading_value,
  unit,
  metadata,
  is_anomaly
) VALUES 
('HVAC_001', 'temperature', 'Floor 1 - Zone A', 22.5, '°C', '{"room": "Conference Room A", "target_temp": 23.0}'::jsonb, false),
('HVAC_001', 'humidity', 'Floor 1 - Zone A', 45.2, '%', '{"room": "Conference Room A", "target_humidity": 50.0}'::jsonb, false),
('ELEVATOR_001', 'vibration', 'Main Elevator Shaft', 0.8, 'mm/s', '{"floor_stops": 12, "last_maintenance": "2024-01-15"}'::jsonb, false),
('POWER_METER_001', 'power_consumption', 'Building Main', 450.7, 'kW', '{"peak_load": 500.0, "efficiency_rating": 0.9}'::jsonb, false),
('WATER_FLOW_001', 'flow_rate', 'Main Water Line', 12.3, 'L/min', '{"pressure": 2.5, "quality_index": 0.95}'::jsonb, false),
('SECURITY_CAM_001', 'motion_detection', 'Lobby', 3, 'count', '{"detection_confidence": 0.98, "activity_level": "normal"}'::jsonb, false);

-- Create test workflow executions
INSERT INTO workflow_executions (
  workflow_rule_id,
  trigger_context,
  execution_status,
  execution_log,
  metadata
) VALUES 
(
  'maintenance_escalation_rule_001',
  '{"trigger_type": "maintenance_overdue", "request_id": "test-request-001", "overdue_hours": 24}'::jsonb,
  'completed',
  '[
    {"step": 1, "action": "notification", "status": "completed", "timestamp": "2024-01-20T10:00:00Z", "details": "Sent notification to ops supervisors"},
    {"step": 2, "action": "escalation", "status": "completed", "timestamp": "2024-01-20T10:05:00Z", "details": "Created escalation log entry"},
    {"step": 3, "action": "resource_allocation", "status": "completed", "timestamp": "2024-01-20T10:10:00Z", "details": "Allocated additional technician"}
  ]'::jsonb,
  '{"execution_time_ms": 15000, "success_rate": 1.0, "automated": true}'::jsonb
),
(
  'emergency_response_rule_001', 
  '{"trigger_type": "emergency_alert", "severity": "high", "location": "Floor 3 - East Wing"}'::jsonb,
  'running',
  '[
    {"step": 1, "action": "immediate_notification", "status": "completed", "timestamp": "2024-01-20T14:30:00Z", "details": "Emergency teams notified"},
    {"step": 2, "action": "area_isolation", "status": "in_progress", "timestamp": "2024-01-20T14:32:00Z", "details": "Securing affected area"}
  ]'::jsonb,
  '{"priority": "critical", "response_team": "emergency_response", "estimated_resolution": "30_minutes"}'::jsonb
);