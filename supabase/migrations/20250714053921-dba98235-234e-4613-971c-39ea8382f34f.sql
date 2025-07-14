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
('ELEVATOR_001', 'vibration', 'Main Elevator Shaft', 0.8, 'mm/s', '{"floor_stops": 12, "last_maintenance": "2024-01-15"}'::jsonb, false),
('POWER_METER_001', 'power_consumption', 'Building Main', 450.7, 'kW', '{"peak_load": 500.0, "efficiency_rating": 0.9}'::jsonb, false);

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
    {"step": 2, "action": "escalation", "status": "completed", "timestamp": "2024-01-20T10:05:00Z", "details": "Created escalation log entry"}
  ]'::jsonb,
  '{"execution_time_ms": 15000, "success_rate": 1.0, "automated": true}'::jsonb
),
(
  'emergency_response_rule_001', 
  '{"trigger_type": "emergency_alert", "severity": "high", "location": "Floor 3 - East Wing"}'::jsonb,
  'running',
  '[
    {"step": 1, "action": "immediate_notification", "status": "completed", "timestamp": "2024-01-20T14:30:00Z", "details": "Emergency teams notified"}
  ]'::jsonb,
  '{"priority": "critical", "response_team": "emergency_response"}'::jsonb
);