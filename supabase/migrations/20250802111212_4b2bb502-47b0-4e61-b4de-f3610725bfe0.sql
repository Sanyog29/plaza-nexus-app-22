-- Add foreign key constraints to security_incidents table
ALTER TABLE public.security_incidents 
ADD CONSTRAINT security_incidents_reported_by_fkey 
FOREIGN KEY (reported_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.security_incidents 
ADD CONSTRAINT security_incidents_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.security_incidents 
ADD CONSTRAINT security_incidents_resolved_by_fkey 
FOREIGN KEY (resolved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;