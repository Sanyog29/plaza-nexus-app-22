-- Phase 1: Clear User-Generated Operational Data
-- Delete in order to respect foreign key constraints

-- Clear request-related data first
DELETE FROM request_attachments;
DELETE FROM request_comments;
DELETE FROM request_status_history;
DELETE FROM escalation_logs;
DELETE FROM maintenance_requests;

-- Clear parking requests BEFORE visitors (foreign key dependency)
DELETE FROM parking_requests;

-- Clear visitor-related data
DELETE FROM visitor_timers;
DELETE FROM visitor_check_logs;
DELETE FROM visitors;

-- Clear booking and order data
DELETE FROM order_items;
DELETE FROM cafeteria_orders;
DELETE FROM service_bookings;
DELETE FROM room_bookings;

-- Clear loyalty and transaction data
DELETE FROM loyalty_transactions;
DELETE FROM loyalty_points;

-- Clear operational tracking data
DELETE FROM staff_attendance;
DELETE FROM daily_checklists;
DELETE FROM task_assignments;
DELETE FROM user_performance_scores;
DELETE FROM shift_change_requests;
DELETE FROM security_shifts;

-- Clear notifications and broadcasts
DELETE FROM notifications;
DELETE FROM broadcasts;

-- Clear knowledge base usage
DELETE FROM knowledge_base_usage;

-- Clear analytics and metrics
DELETE FROM analytics_summaries;
DELETE FROM performance_metrics;

-- Clear staff requests
DELETE FROM staff_role_requests;

-- Phase 2: Clear Static/Placeholder Data

-- Clear info hub content
DELETE FROM info_items;
DELETE FROM info_categories;

-- Clear cafeteria menu structure
DELETE FROM cafeteria_menu_items;
DELETE FROM cafeteria_menu_categories;

-- Clear service structure
DELETE FROM service_items;
DELETE FROM service_categories;

-- Clear room definitions
DELETE FROM rooms;

-- Clear maintenance categories
DELETE FROM maintenance_categories;
DELETE FROM categories;

-- Clear knowledge base
DELETE FROM knowledge_base_articles;

-- Clear equipment and assets
DELETE FROM amc_alerts;
DELETE FROM assets;
DELETE FROM equipment;

-- Clear utility data
DELETE FROM utility_readings;
DELETE FROM utility_meters;

-- Clear cost and budget data
DELETE FROM budget_allocations;
DELETE FROM cost_centers;

-- Clear task categories
DELETE FROM simple_task_categories;

-- Clear visitor categories
DELETE FROM visitor_categories;

-- Clear SLA and penalty data
DELETE FROM sla_escalation_rules;
DELETE FROM sla_configs;
DELETE FROM service_penalty_matrix;

-- Clear alerts
DELETE FROM alerts;

-- Phase 3: Clear Storage Files (except avatars bucket)
-- Clear maintenance attachments
DELETE FROM storage.objects WHERE bucket_id = 'maintenance-attachments';

-- Clear visitor photos
DELETE FROM storage.objects WHERE bucket_id = 'visitor-photos';