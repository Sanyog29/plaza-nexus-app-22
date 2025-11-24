
-- PHASE 1b: Update is_staff() function to include bms_operator
-- Now that enum value is committed, we can use it

CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = $1
      AND role IN (
        -- Admin & Supervision
        'admin',
        'ops_supervisor',
        
        -- L1 Operational Staff (field workers)
        'mst',              -- Maintenance Service Technician
        'fe',               -- Field Executive
        'hk',               -- Housekeeping
        'se',               -- Service Engineer
        'bms_operator',     -- BMS Operator ✅ CRITICAL FIX
        'field_staff',      -- General field staff
        'staff',            -- General staff
        
        -- L2 Management
        'assistant_manager',
        'assistant_floor_manager',
        
        -- L3 Senior Management
        'assistant_general_manager',
        'assistant_vice_president',
        
        -- L4 Executives
        'vp',
        'cxo',
        'ceo',
        
        -- Tenants with elevated access
        'tenant_manager',
        'super_tenant'
      )
  );
$function$;

-- Verify the fix
SELECT 
  'verification' as test,
  pg_get_functiondef((
    SELECT oid FROM pg_proc 
    WHERE proname = 'is_staff' AND pronamespace = 'public'::regnamespace
  ))::text LIKE '%bms_operator%' as contains_bms_operator;
