-- Fix ALL foreign key constraints on maintenance_requests to reference profiles instead of auth.users

-- Drop the incorrect foreign key constraints
ALTER TABLE public.maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_assigned_to_fkey;

ALTER TABLE public.maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_reported_by_fkey;

-- Create new foreign key constraints that reference public.profiles
ALTER TABLE public.maintenance_requests 
ADD CONSTRAINT maintenance_requests_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.maintenance_requests 
ADD CONSTRAINT maintenance_requests_reported_by_fkey 
FOREIGN KEY (reported_by) REFERENCES public.profiles(id) ON DELETE SET NULL;