-- Fix the foreign key constraint to point to maintenance_categories instead of categories
ALTER TABLE public.maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_category_id_fkey;

ALTER TABLE public.maintenance_requests 
ADD CONSTRAINT maintenance_requests_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.maintenance_categories(id) ON DELETE SET NULL;