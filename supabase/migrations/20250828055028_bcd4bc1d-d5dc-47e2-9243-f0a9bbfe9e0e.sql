
-- 1) Deduplicate any existing rows by technician_id (keep one row per technician)
WITH first_rows AS (
  SELECT technician_id, MIN(id) AS keep_id
  FROM public.technician_points
  GROUP BY technician_id
)
DELETE FROM public.technician_points tp
USING first_rows fr
WHERE tp.technician_id = fr.technician_id
  AND tp.id <> fr.keep_id;

-- 2) Add the UNIQUE constraint required for ON CONFLICT (technician_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'technician_points_technician_id_key'
      AND conrelid = 'public.technician_points'::regclass
  ) THEN
    ALTER TABLE public.technician_points
      ADD CONSTRAINT technician_points_technician_id_key UNIQUE (technician_id);
  END IF;
END
$$;
