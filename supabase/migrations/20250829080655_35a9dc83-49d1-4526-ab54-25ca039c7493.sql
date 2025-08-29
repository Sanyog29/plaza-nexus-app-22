-- Fix the complete_request RPC function to use correct column name
DROP FUNCTION IF EXISTS public.complete_request(uuid, text);

CREATE OR REPLACE FUNCTION public.complete_request(
  p_request_id uuid,
  p_closure_reason text DEFAULT 'Request completed'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record RECORD;
  current_user_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;
  
  -- Get request details
  SELECT * INTO request_record
  FROM maintenance_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'request_not_found');
  END IF;
  
  -- Check authorization (either assigned technician or staff)
  IF request_record.assigned_to != current_user_id AND NOT is_staff(current_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authorized');
  END IF;
  
  -- Check if request is in valid state for completion
  IF request_record.status NOT IN ('assigned', 'in_progress') THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_status');
  END IF;
  
  -- Check if both photos are uploaded
  IF request_record.before_photo_url IS NULL OR request_record.after_photo_url IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'photos_required');
  END IF;
  
  -- Update request to completed status
  UPDATE maintenance_requests
  SET 
    status = 'completed',
    completed_at = NOW(),
    closure_reason = COALESCE(p_closure_reason, 'Request completed'),
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Log workflow transition
  INSERT INTO request_workflow_transitions (
    request_id,
    from_status,
    to_status,
    changed_by,
    notes
  ) VALUES (
    p_request_id,
    request_record.status,
    'completed',
    current_user_id,
    p_closure_reason
  );
  
  -- Create notification for the person who reported the request
  IF request_record.reported_by IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      action_url
    ) VALUES (
      request_record.reported_by,
      'Request Completed',
      format('Your maintenance request "%s" has been completed.', request_record.title),
      'success',
      format('/requests/%s', p_request_id)
    );
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Request completed successfully');
END;
$$;