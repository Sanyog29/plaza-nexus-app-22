-- Production Data Reset & Clean Placeholder Removal (Fixed)
-- Handle foreign key constraints properly

-- 1. Clear dependent tables first (those with foreign keys)
DELETE FROM public.parking_requests;
DELETE FROM public.request_workflow_transitions;
DELETE FROM public.request_attachments;
DELETE FROM public.request_status_history;
DELETE FROM public.visitor_timers;

-- 2. Clear main tables
DELETE FROM public.maintenance_requests;
DELETE FROM public.visitors;
DELETE FROM public.room_bookings;
DELETE FROM public.alerts;

-- 3. Clear analytics and metrics
DELETE FROM public.analytics_summaries;
DELETE FROM public.performance_metrics;
DELETE FROM public.workflow_executions;
DELETE FROM public.escalation_logs;
DELETE FROM public.escalation_predictions;

-- 4. Clear operational data
DELETE FROM public.utility_readings;
DELETE FROM public.staff_workload_metrics;

-- 5. Clear vendor and cafeteria data
DELETE FROM public.vendor_analytics;
DELETE FROM public.commission_records;
DELETE FROM public.order_feedback;
DELETE FROM public.order_items;
DELETE FROM public.cafeteria_orders;
DELETE FROM public.loyalty_transactions;

-- 6. Clear other operational records
DELETE FROM public.security_incidents;
DELETE FROM public.communication_threads;
DELETE FROM public.knowledge_base_usage;

-- Application is now reset to clean production state