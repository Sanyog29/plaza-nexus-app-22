-- Create ticket_closures table for tracking closures
CREATE TABLE IF NOT EXISTS public.ticket_closures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL UNIQUE,
  closed_by uuid NOT NULL,
  before_photo_url text,
  after_photo_url text,
  closed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ticket_closures ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Staff can view all ticket closures" ON public.ticket_closures;
  DROP POLICY IF EXISTS "Staff can insert ticket closures" ON public.ticket_closures;  
  DROP POLICY IF EXISTS "Staff can update ticket closures" ON public.ticket_closures;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create RLS policies
CREATE POLICY "Staff can view all ticket closures" 
ON public.ticket_closures 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can insert ticket closures" 
ON public.ticket_closures 
FOR INSERT 
WITH CHECK (is_staff(auth.uid()) AND closed_by = auth.uid());

CREATE POLICY "Staff can update ticket closures" 
ON public.ticket_closures 
FOR UPDATE 
USING (is_staff(auth.uid()));

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_ticket_closures_request_id'
  ) THEN
    ALTER TABLE public.ticket_closures 
    ADD CONSTRAINT fk_ticket_closures_request_id 
    FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes if not exists
CREATE INDEX IF NOT EXISTS idx_ticket_closures_request_id ON public.ticket_closures(request_id);
CREATE INDEX IF NOT EXISTS idx_ticket_closures_closed_by ON public.ticket_closures(closed_by);
CREATE INDEX IF NOT EXISTS idx_ticket_closures_closed_at ON public.ticket_closures(closed_at);

-- Update the complete_request function with simplified logic
DROP FUNCTION IF EXISTS public.complete_request(uuid, text);

CREATE OR REPLACE FUNCTION public.complete_request(
  request_id uuid,
  p_closure_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record RECORD;
  rows_updated integer;
BEGIN
  -- Get request details
  SELECT * INTO request_record
  FROM maintenance_requests
  WHERE id = request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Check if request is in valid state for completion
  IF request_record.status NOT IN ('assigned', 'in_progress') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request cannot be completed from current status: ' || request_record.status);
  END IF;

  -- Check if both photos are uploaded
  IF request_record.before_photo_url IS NULL OR request_record.after_photo_url IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Both before and after photos must be uploaded before completing the request');
  END IF;

  -- Check if user is authorized (assigned technician or admin/staff)
  IF request_record.assigned_to != auth.uid() AND NOT is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to complete this request');
  END IF;

  -- Insert or update ticket closure record
  INSERT INTO ticket_closures (request_id, closed_by, before_photo_url, after_photo_url, closed_at)
  VALUES (request_id, auth.uid(), request_record.before_photo_url, request_record.after_photo_url, NOW())
  ON CONFLICT (request_id) DO UPDATE
    SET closed_by = EXCLUDED.closed_by,
        before_photo_url = EXCLUDED.before_photo_url,
        after_photo_url = EXCLUDED.after_photo_url,
        closed_at = EXCLUDED.closed_at,
        updated_at = NOW();

  -- Update maintenance request status to closed
  UPDATE maintenance_requests
  SET 
    status = 'closed',
    completed_at = NOW(),
    closure_reason = p_closure_reason,
    updated_at = NOW()
  WHERE id = request_id;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update request status');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Request closed successfully');
END;
$$;