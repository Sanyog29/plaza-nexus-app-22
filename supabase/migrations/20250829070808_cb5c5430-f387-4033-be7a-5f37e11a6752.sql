
-- Align RLS helper with app roles so MST users are treated as staff
CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = $1
      AND role IN ('admin', 'ops_supervisor', 'field_staff', 'mst', 'assistant_manager')
  );
$$;
