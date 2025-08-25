
-- Replace assign_and_start_request to not depend on create_notification()
-- and write directly into the notifications table.

CREATE OR REPLACE FUNCTION public.assign_and_start_request(request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Ensure only staff can assign
  IF NOT is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only staff can assign requests');
  END IF;

  -- Get request + reporter
  SELECT mr.*, p.id AS reporter_id
  INTO request_record
  FROM maintenance_requests mr
  LEFT JOIN profiles p ON mr.reported_by = p.id
  WHERE mr.id = request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Request not found');
  END IF;

  -- Validate current status
  IF request_record.status NOT IN ('pending', 'assigned') THEN
    RETURN jsonb_build_object('error', 'Request is not available for assignment');
  END IF;

  -- Assign to current user and start
  UPDATE maintenance_requests
  SET
    assigned_to = auth.uid(),
    status = 'in_progress',
    assigned_at = COALESCE(assigned_at, now()),
    work_started_at = now(),
    updated_at = now()
  WHERE id = request_id;

  -- Track workflow transition
  INSERT INTO request_workflow_transitions
    (request_id, from_status, to_status, changed_by, notes)
  VALUES
    (request_id, request_record.status, 'in_progress', auth.uid(), 'Request assigned and work started');

  -- Notify tenant (insert directly into notifications)
  IF request_record.reporter_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      priority,
      action_url,
      metadata
    ) VALUES (
      request_record.reporter_id,
      'Request Assigned & Work Started',
      format('Your maintenance request "%s" has been assigned and work has begun.', COALESCE(request_record.title, '')),
      'maintenance',
      'normal',
      format('/requests/%s', request_id),
      jsonb_build_object(
        'request_id', request_id,
        'assigned_to', auth.uid(),
        'status', 'in_progress'
      )
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Request assigned and started successfully');
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_and_start_request(request_id uuid, staff_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Ensure only staff can assign
  IF NOT is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only staff can assign requests');
  END IF;

  -- Get request + reporter
  SELECT mr.*, p.id AS reporter_id
  INTO request_record
  FROM maintenance_requests mr
  LEFT JOIN profiles p ON mr.reported_by = p.id
  WHERE mr.id = request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Request not found');
  END IF;

  -- Validate current status
  IF request_record.status NOT IN ('pending', 'assigned') THEN
    RETURN jsonb_build_object('error', 'Request cannot be assigned in current status');
  END IF;

  -- Assign to specified staff and start
  UPDATE maintenance_requests
  SET
    assigned_to = staff_id,
    status = 'in_progress',
    assigned_at = COALESCE(assigned_at, now()),
    work_started_at = now(),
    updated_at = now()
  WHERE id = request_id;

  -- Track workflow transition
  INSERT INTO request_workflow_transitions
    (request_id, from_status, to_status, changed_by, notes)
  VALUES
    (request_id, request_record.status, 'in_progress', staff_id, 'Request assigned and work started');

  -- Notify tenant (insert directly into notifications)
  IF request_record.reporter_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      priority,
      action_url,
      metadata
    ) VALUES (
      request_record.reporter_id,
      'Request Assigned & Work Started',
      format('Your maintenance request "%s" has been assigned and work has begun.', COALESCE(request_record.title, '')),
      'maintenance',
      'normal',
      format('/requests/%s', request_id),
      jsonb_build_object(
        'request_id', request_id,
        'assigned_to', staff_id,
        'status', 'in_progress'
      )
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Request assigned and started successfully');
END;
$$;
