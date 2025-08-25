-- Update assign_and_start_request function to send notification to reporter
CREATE OR REPLACE FUNCTION public.assign_and_start_request(request_id uuid, staff_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    request_record RECORD;
    result jsonb;
BEGIN
    -- Get the request details including reporter info
    SELECT mr.*, p.first_name, p.last_name, p.id as reporter_id
    INTO request_record
    FROM maintenance_requests mr
    LEFT JOIN profiles p ON mr.reported_by = p.id
    WHERE mr.id = request_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Request not found');
    END IF;
    
    -- Check if request can be assigned
    IF request_record.status NOT IN ('pending', 'assigned') THEN
        RETURN jsonb_build_object('error', 'Request cannot be assigned in current status');
    END IF;
    
    -- Update the request
    UPDATE maintenance_requests 
    SET 
        assigned_to = staff_id,
        status = 'in_progress',
        assignment_acknowledged_at = NOW(),
        updated_at = NOW()
    WHERE id = request_id;
    
    -- Insert workflow transition
    INSERT INTO request_workflow_transitions 
    (request_id, from_status, to_status, changed_by, notes)
    VALUES 
    (request_id, request_record.status, 'in_progress', staff_id, 'Request assigned and work started');
    
    -- Create notification for the request reporter
    IF request_record.reporter_id IS NOT NULL THEN
        PERFORM create_notification(
            request_record.reporter_id,
            'Request Assigned & Work Started',
            format('Your maintenance request "%s" has been assigned to a technician and work has begun.', request_record.title),
            'info'::notification_type,
            format('/requests/%s', request_id)
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Request assigned and started successfully'
    );
END;
$$;