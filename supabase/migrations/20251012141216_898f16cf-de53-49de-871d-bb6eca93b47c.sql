-- Update is_staff function to include super_tenant
-- This must be done after the enum value is committed
CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = $1
      AND role IN (
        'admin',
        'ops_supervisor',
        'field_staff',
        'mst',
        'fe',
        'staff',
        'hk',
        'se',
        'assistant_manager',
        'assistant_floor_manager',
        'assistant_general_manager',
        'assistant_vice_president',
        'vp',
        'cxo',
        'ceo',
        'tenant_manager',
        'super_tenant'
      )
  );
$function$;