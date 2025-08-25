-- Add new status values to support the unified workflow
-- First, let's add the new status enum values
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'en_route';

-- Add new columns to track workflow state transitions
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS en_route_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS work_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS workflow_step integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS estimated_arrival timestamp with time zone,
ADD COLUMN IF NOT EXISTS technician_location jsonb;

-- Create a table to track workflow transitions for audit and real-time updates
CREATE TABLE IF NOT EXISTS public.request_workflow_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  from_status request_status,
  to_status request_status NOT NULL,
  changed_by uuid REFERENCES profiles(id),
  changed_at timestamp with time zone DEFAULT now(),
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.request_workflow_transitions ENABLE ROW LEVEL SECURITY;

-- Create policies for workflow transitions
CREATE POLICY "Users can view workflow transitions for their requests"
ON public.request_workflow_transitions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM maintenance_requests mr 
    WHERE mr.id = request_workflow_transitions.request_id 
    AND (mr.reported_by = auth.uid() OR mr.assigned_to = auth.uid() OR is_staff(auth.uid()))
  )
);

CREATE POLICY "Staff can insert workflow transitions"
ON public.request_workflow_transitions FOR INSERT
WITH CHECK (is_staff(auth.uid()));

-- Create a function to update workflow step and timestamps automatically
CREATE OR REPLACE FUNCTION public.update_workflow_step()
RETURNS TRIGGER AS $$
BEGIN
  -- Update workflow step based on status
  NEW.workflow_step = CASE NEW.status
    WHEN 'pending' THEN 1
    WHEN 'assigned' THEN 2
    WHEN 'en_route' THEN 3
    WHEN 'in_progress' THEN 4
    WHEN 'completed' THEN 5
    WHEN 'cancelled' THEN 0
    ELSE OLD.workflow_step
  END;
  
  -- Update timestamp fields based on status transitions
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    CASE NEW.status
      WHEN 'assigned' THEN
        NEW.assigned_at = COALESCE(NEW.assigned_at, now());
      WHEN 'en_route' THEN
        NEW.en_route_at = COALESCE(NEW.en_route_at, now());
      WHEN 'in_progress' THEN
        NEW.work_started_at = COALESCE(NEW.work_started_at, now());
      ELSE
        NULL;
    END CASE;
    
    -- Insert workflow transition record
    INSERT INTO public.request_workflow_transitions (
      request_id, from_status, to_status, changed_by, notes
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), 
      CASE NEW.status
        WHEN 'assigned' THEN 'Request assigned to technician'
        WHEN 'en_route' THEN 'Technician is en route to location'
        WHEN 'in_progress' THEN 'Work has started on the request'
        WHEN 'completed' THEN 'Request has been completed'
        WHEN 'cancelled' THEN 'Request has been cancelled'
        ELSE 'Status updated'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for workflow step updates
DROP TRIGGER IF EXISTS update_workflow_step_trigger ON public.maintenance_requests;
CREATE TRIGGER update_workflow_step_trigger
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workflow_step();

-- Update existing requests to have proper workflow steps
UPDATE public.maintenance_requests SET workflow_step = CASE status
  WHEN 'pending' THEN 1
  WHEN 'assigned' THEN 2
  WHEN 'en_route' THEN 3
  WHEN 'in_progress' THEN 4
  WHEN 'completed' THEN 5
  WHEN 'cancelled' THEN 0
  ELSE 1
END WHERE workflow_step IS NULL OR workflow_step = 1;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_workflow_step ON public.maintenance_requests(workflow_step);
CREATE INDEX IF NOT EXISTS idx_request_workflow_transitions_request_id ON public.request_workflow_transitions(request_id);
CREATE INDEX IF NOT EXISTS idx_request_workflow_transitions_changed_at ON public.request_workflow_transitions(changed_at DESC);