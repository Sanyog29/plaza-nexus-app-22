-- CRITICAL SECURITY FIX: Part 2 - Fix remaining functions

-- Fix all remaining trigger functions
ALTER FUNCTION public.sync_profile_role() SET search_path = public;
ALTER FUNCTION public.sync_user_email() SET search_path = public;
ALTER FUNCTION public.log_unauthorized_access_attempt(text, text, text) SET search_path = public;
ALTER FUNCTION public.update_category_usage_count() SET search_path = public;
ALTER FUNCTION public.set_sla_breach_time() SET search_path = public;
ALTER FUNCTION public.track_request_status_change() SET search_path = public;
ALTER FUNCTION public.track_profile_changes() SET search_path = public;
ALTER FUNCTION public.log_sensitive_operation() SET search_path = public;
ALTER FUNCTION public.award_completion_points() SET search_path = public;
ALTER FUNCTION public.update_photo_upload_status() SET search_path = public;
ALTER FUNCTION public.calculate_loyalty_points() SET search_path = public;
ALTER FUNCTION public.update_request_offers_updated_at() SET search_path = public;
ALTER FUNCTION public.cast_request_priority() SET search_path = public;
ALTER FUNCTION public.generate_analytics_summary(date, text) SET search_path = public;
ALTER FUNCTION public.calculate_daily_metrics() SET search_path = public;
ALTER FUNCTION public.check_sla_breaches() SET search_path = public;
ALTER FUNCTION public.call_booking_reminders() SET search_path = public;

-- Fix any additional SECURITY DEFINER functions dynamically
DO $$
DECLARE
    func_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name,
               p.proname as function_name,
               pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.prosecdef = true
          AND p.proname NOT IN (
            'sanitize_text_input',
            'get_user_role',
            'is_admin', 'is_staff', 'is_food_vendor',
            'is_l2', 'is_l3', 'is_l4', 'is_management',
            'can_view_profile_sensitive_data',
            'log_audit_event', 'toggle_access_point_lock',
            'acknowledge_ticket', 'update_user_role',
            'admin_approve_vendor', 'admin_bulk_create_users',
            'get_user_management_stats', 'get_user_management_data',
            'admin_cascade_delete_user_data', 'get_invitation_details',
            'get_role_defaults', 'execute_workflow_trigger',
            'calculate_cross_module_kpis', 'calculate_staff_workload_score',
            'suggest_optimal_staff_assignment', 'soft_delete_maintenance_requests',
            'assign_and_start_request', 'accept_request_offer',
            'decline_request_offer', 'update_staff_availability',
            'sync_profile_role', 'sync_user_email',
            'log_unauthorized_access_attempt', 'update_category_usage_count',
            'set_sla_breach_time', 'track_request_status_change',
            'track_profile_changes', 'log_sensitive_operation',
            'award_completion_points', 'update_photo_upload_status',
            'calculate_loyalty_points', 'update_request_offers_updated_at',
            'cast_request_priority', 'generate_analytics_summary',
            'calculate_daily_metrics', 'check_sla_breaches',
            'call_booking_reminders'
          )
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public',
                         func_record.schema_name,
                         func_record.function_name,
                         func_record.args);
            fixed_count := fixed_count + 1;
        EXCEPTION WHEN OTHERS THEN
            CONTINUE;
        END;
    END LOOP;
    
    RAISE NOTICE 'Additional functions fixed: %', fixed_count;
END $$;