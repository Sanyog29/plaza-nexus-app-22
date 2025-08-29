-- Fix search_path security issues for critical functions that need it
-- Update the complete_request function to have proper search_path
CREATE OR REPLACE FUNCTION public.complete_request(
  p_request_id UUID,
  p_closure_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_record RECORD;
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

-- Update the is_admin function to have proper search_path
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = $1 AND role = 'admin'
  );
$$;

-- Update the is_staff function to have proper search_path
CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = $1 AND role IN ('admin', 'ops_supervisor', 'field_staff')
  );
$$;