-- Add foreign key constraint from visitors.host_id to profiles.id
ALTER TABLE public.visitors 
ADD CONSTRAINT visitors_host_id_fkey 
FOREIGN KEY (host_id) REFERENCES public.profiles(id) ON DELETE SET NULL;