-- Drop and recreate complete_request function
DROP FUNCTION IF EXISTS public.complete_request(uuid, text);

CREATE OR REPLACE FUNCTION public.complete_request(
  p_request_id uuid,
  p_closure_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Get request details and validate
  SELECT * INTO request_record
  FROM maintenance_requests 
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  
  -- Check authorization - must be assigned staff or admin
  IF NOT (is_staff(auth.uid()) AND (request_record.assigned_to = auth.uid() OR is_admin(auth.uid()))) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to complete this request');
  END IF;
  
  -- Validate photos are uploaded
  IF request_record.before_photo_url IS NULL OR request_record.after_photo_url IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Both before and after photos must be uploaded before completing');
  END IF;
  
  -- Update request to completed status
  UPDATE maintenance_requests 
  SET 
    status = 'completed',
    completed_at = NOW(),
    completion_notes = COALESCE(p_closure_reason, 'Request completed'),
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Log the completion in workflow transitions
  INSERT INTO request_workflow_transitions (
    request_id, from_status, to_status, changed_by, notes
  ) VALUES (
    p_request_id, request_record.status, 'completed', auth.uid(), p_closure_reason
  );
  
  -- Create completion notification if notifications table exists
  INSERT INTO notifications (
    user_id, title, message, type, action_url
  ) 
  SELECT 
    request_record.reported_by,
    'Request Completed',
    'Your maintenance request "' || request_record.title || '" has been completed.',
    'success',
    '/requests/' || p_request_id
  WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications');
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Request completed successfully',
    'request_id', p_request_id
  );
END;
$$;