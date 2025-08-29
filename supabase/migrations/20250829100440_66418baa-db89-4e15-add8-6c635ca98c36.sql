-- First, drop any existing constraint that might be causing conflicts
ALTER TABLE request_workflow_states DROP CONSTRAINT IF EXISTS request_workflow_states_request_id_unique;

-- Add the unique constraint properly
ALTER TABLE request_workflow_states 
ADD CONSTRAINT request_workflow_states_request_id_unique UNIQUE (request_id);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_request_workflow_states_technician_id 
ON request_workflow_states(technician_id);

CREATE INDEX IF NOT EXISTS idx_request_workflow_states_current_stage 
ON request_workflow_states(current_stage);

-- Create the missing complete_request RPC function that components are calling
CREATE OR REPLACE FUNCTION public.complete_request(
  p_request_id UUID,
  p_closure_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
  result JSONB;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM maintenance_requests 
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request not found'
    );
  END IF;
  
  -- Check if both photos are uploaded
  IF request_record.before_photo_url IS NULL OR request_record.after_photo_url IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Both before and after photos are required to complete the request'
    );
  END IF;
  
  -- Update the request to completed status
  UPDATE maintenance_requests
  SET 
    status = 'completed',
    completed_at = NOW(),
    closure_reason = COALESCE(p_closure_reason, 'Request completed'),
    updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Log the completion in workflow transitions
  INSERT INTO request_workflow_transitions (
    request_id,
    from_status,
    to_status,
    changed_by,
    changed_at,
    notes
  ) VALUES (
    p_request_id,
    request_record.status,
    'completed',
    auth.uid(),
    NOW(),
    COALESCE(p_closure_reason, 'Request completed via system')
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Request completed successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;