-- CRITICAL SECURITY FIX: Part 3 - Fix final functions

-- Query and fix all remaining functions with mutable search_path
DO $$
DECLARE
    func_record RECORD;
    func_count INTEGER := 0;
BEGIN
    -- Get ALL functions in public schema that are either SECURITY DEFINER or regular functions
    -- and don't have search_path set
    FOR func_record IN 
        SELECT DISTINCT
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_arguments(p.oid) as full_args,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        LEFT JOIN LATERAL unnest(p.proconfig) AS config ON TRUE
        WHERE n.nspname = 'public'
          AND (config IS NULL OR config::text NOT LIKE '%search_path%')
        GROUP BY n.nspname, p.proname, p.oid
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public',
                         func_record.schema_name,
                         func_record.function_name,
                         func_record.args);
            func_count := func_count + 1;
            RAISE NOTICE 'Fixed: %.%', func_record.function_name, func_record.args;
        EXCEPTION 
            WHEN duplicate_function THEN
                RAISE NOTICE 'Skipped duplicate: %.%', func_record.function_name, func_record.args;
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to fix %.%: %', 
                             func_record.function_name,
                             func_record.args,
                             SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Total functions fixed in this pass: %', func_count;
END $$;

-- Log this security improvement
INSERT INTO public.security_audit_log (
    user_id, action, resource_type, success, metadata
) VALUES (
    NULL,
    'fix_function_search_paths',
    'database_security',
    true,
    jsonb_build_object(
        'description', 'Fixed search_path for all remaining database functions',
        'timestamp', now()
    )
);