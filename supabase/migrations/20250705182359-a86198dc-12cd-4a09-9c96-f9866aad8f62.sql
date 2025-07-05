-- Fix the remaining foreign key constraints

-- Fix broadcasts - set NULL for created_by to preserve broadcast history
ALTER TABLE public.broadcasts 
DROP CONSTRAINT IF EXISTS broadcasts_created_by_fkey;

ALTER TABLE public.broadcasts 
ADD CONSTRAINT broadcasts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix request_status_history - set NULL for changed_by to preserve audit trail
ALTER TABLE public.request_status_history 
DROP CONSTRAINT IF EXISTS request_status_history_changed_by_fkey;

ALTER TABLE public.request_status_history 
ADD CONSTRAINT request_status_history_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;