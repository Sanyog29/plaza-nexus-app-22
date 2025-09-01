-- Production Data Reset & Clean Placeholder Removal
-- Clear all test/placeholder data from tables

-- 1. Clear all maintenance requests and related data
DELETE FROM public.request_workflow_transitions;
DELETE FROM public.request_attachments;
DELETE FROM public.request_status_history;
DELETE FROM public.maintenance_requests;

-- 2. Clear analytics and performance metrics
DELETE FROM public.analytics_summaries;
DELETE FROM public.performance_metrics;
DELETE FROM public.workflow_executions;
DELETE FROM public.escalation_logs;

-- 3. Clear visitor test data
DELETE FROM public.visitor_timers;
DELETE FROM public.visitors;

-- 4. Clear booking test data
DELETE FROM public.room_bookings;

-- 5. Clear alerts test data  
DELETE FROM public.alerts;

-- 6. Clear other test operational data
DELETE FROM public.utility_readings;
DELETE FROM public.staff_workload_metrics;
DELETE FROM public.vendor_analytics;
DELETE FROM public.commission_records;
DELETE FROM public.order_feedback;
DELETE FROM public.order_items;
DELETE FROM public.cafeteria_orders;
DELETE FROM public.loyalty_transactions;

-- Reset application to clean state for production use