-- Create RPC function to complete maintenance requests with proper validation
CREATE OR REPLACE FUNCTION public.complete_request(request_id uuid, completion_notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  result jsonb;
BEGIN
  -- Get request details
  SELECT * INTO request_record
  FROM maintenance_requests 
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Request not found');
  END IF;
  
  -- Check if request can be completed
  IF request_record.status NOT IN ('assigned', 'in_progress') THEN
    RETURN jsonb_build_object('error', 'Request cannot be completed from current status: ' || request_record.status);
  END IF;
  
  -- Validate photos are uploaded
  IF request_record.before_photo_url IS NULL THEN
    RETURN jsonb_build_object('error', 'Before photo is required to complete the request');
  END IF;
  
  IF request_record.after_photo_url IS NULL THEN
    RETURN jsonb_build_object('error', 'After photo is required to complete the request');
  END IF;
  
  -- Update request status
  UPDATE maintenance_requests 
  SET 
    status = 'completed',
    completed_at = NOW(),
    completion_notes = COALESCE(complete_request.completion_notes, completion_notes),
    updated_at = NOW()
  WHERE id = request_id;
  
  -- Insert status history record
  INSERT INTO request_status_history (request_id, status, changed_by, notes)
  VALUES (request_id, 'completed', auth.uid(), COALESCE(complete_request.completion_notes, 'Request completed'));
  
  RETURN jsonb_build_object('success', true, 'message', 'Request completed successfully');
END;
$$;

-- Update RLS policy for request_status_history to allow viewing by relevant users
DROP POLICY IF EXISTS "Users can view status history for their requests" ON request_status_history;
CREATE POLICY "Users can view status history for their requests" 
ON request_status_history FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM maintenance_requests mr 
    WHERE mr.id = request_status_history.request_id 
    AND (mr.reported_by = auth.uid() OR mr.assigned_to = auth.uid() OR is_staff(auth.uid()))
  )
);