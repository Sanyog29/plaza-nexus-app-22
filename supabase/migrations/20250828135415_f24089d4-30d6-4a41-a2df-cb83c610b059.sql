-- Fix ambiguous column reference by renaming parameter
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

  -- Update the request
  UPDATE maintenance_requests
  SET 
    status = 'completed',
    completed_at = NOW(),
    closure_reason = p_closure_reason,
    updated_at = NOW()
  WHERE id = request_id;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update request');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Request completed successfully');
END;
$$;