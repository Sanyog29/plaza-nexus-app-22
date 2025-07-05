-- Fix the request_status_history foreign key constraint

-- Drop and recreate the foreign key constraint to ensure it's properly set up
ALTER TABLE public.request_status_history 
DROP CONSTRAINT IF EXISTS request_status_history_request_id_fkey;

ALTER TABLE public.request_status_history 
ADD CONSTRAINT request_status_history_request_id_fkey 
FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;