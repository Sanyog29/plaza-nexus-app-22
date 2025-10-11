-- Create maintenance_processes table
CREATE TABLE IF NOT EXISTS public.maintenance_processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Add process_id to maintenance_requests
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS process_id UUID REFERENCES public.maintenance_processes(id) ON DELETE SET NULL;

-- Enable RLS on maintenance_processes
ALTER TABLE public.maintenance_processes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for maintenance_processes
CREATE POLICY "Everyone can view active processes"
ON public.maintenance_processes
FOR SELECT
USING (is_active = true OR auth.uid() IS NOT NULL);

CREATE POLICY "Staff can insert processes"
ON public.maintenance_processes
FOR INSERT
WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update processes"
ON public.maintenance_processes
FOR UPDATE
USING (is_staff(auth.uid()));

CREATE POLICY "Admins can delete processes"
ON public.maintenance_processes
FOR DELETE
USING (is_admin(auth.uid()));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_processes_active ON public.maintenance_processes(is_active);
CREATE INDEX IF NOT EXISTS idx_maintenance_processes_order ON public.maintenance_processes(display_order);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_process ON public.maintenance_requests(process_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_maintenance_processes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_maintenance_processes_updated_at
BEFORE UPDATE ON public.maintenance_processes
FOR EACH ROW
EXECUTE FUNCTION public.update_maintenance_processes_updated_at();