
BEGIN;

-- 1) Drop the incorrect FK referencing maintenance_categories
ALTER TABLE public.maintenance_requests
  DROP CONSTRAINT IF EXISTS maintenance_requests_category_id_fkey;

-- 2) Align existing rows so new FK won't fail
--    a) If category_id points to a value not present in main_categories, null it out
UPDATE public.maintenance_requests mr
SET category_id = NULL
WHERE category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.main_categories mc WHERE mc.id = mr.category_id
  );

--    b) If we have a main_category_id but category_id is NULL, copy it over
UPDATE public.maintenance_requests mr
SET category_id = main_category_id
WHERE category_id IS NULL
  AND main_category_id IS NOT NULL;

-- 3) Recreate the FK to main_categories
ALTER TABLE public.maintenance_requests
  ADD CONSTRAINT maintenance_requests_category_id_fkey
  FOREIGN KEY (category_id)
  REFERENCES public.main_categories(id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

-- 4) Ensure index exists
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_category_id
  ON public.maintenance_requests(category_id);

COMMIT;
