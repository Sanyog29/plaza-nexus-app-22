
-- Expand is_staff() to include all staff-level roles used in the app,
-- so staff (including FE) can see maintenance_requests.
-- This resolves the "zero" counts caused by RLS returning empty results.

CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = $1
      AND role IN (
        'admin',
        'ops_supervisor',
        'field_staff',
        'mst',
        'fe',                  -- Facilities Executive
        'staff',
        'hk',                  -- Housekeeping (if applicable)
        'se',                  -- Security (if applicable)
        'assistant_manager',
        'assistant_floor_manager',
        'assistant_general_manager',
        'assistant_vice_president',
        'vp',
        'cxo',
        'ceo',
        'tenant_manager'
      )
  );
$$;
