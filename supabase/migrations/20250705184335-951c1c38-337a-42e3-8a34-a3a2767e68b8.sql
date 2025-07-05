-- Fix foreign key constraints to reference profiles table instead of auth.users

-- Drop existing foreign key constraints that reference auth.users
ALTER TABLE public.request_status_history 
DROP CONSTRAINT IF EXISTS request_status_history_changed_by_fkey;

ALTER TABLE public.broadcasts 
DROP CONSTRAINT IF EXISTS broadcasts_created_by_fkey;

-- Create new foreign key constraints that reference public.profiles
ALTER TABLE public.request_status_history 
ADD CONSTRAINT request_status_history_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.broadcasts 
ADD CONSTRAINT broadcasts_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;