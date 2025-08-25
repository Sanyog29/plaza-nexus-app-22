-- Fix security issues for request offers functions by setting search_path

-- Update broadcast_request_offer function with secure search_path
CREATE OR REPLACE FUNCTION public.broadcast_request_offer(
    p_request_id UUID,
    p_expires_in_minutes INTEGER DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_request RECORD;
    v_offer_id UUID;
    v_field_staff RECORD;
    v_recipients_count INTEGER := 0;
BEGIN
    -- Validate request exists and is available for assignment
    SELECT * INTO v_request
    FROM maintenance_requests
    WHERE id = p_request_id 
      AND status IN ('pending', 'open') 
      AND assigned_to IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_available');
    END IF;
    
    -- Create the offer
    INSERT INTO request_offers (
        request_id, category_id, expires_at
    ) VALUES (
        p_request_id, 
        v_request.category_id,
        now() + (p_expires_in_minutes || ' minutes')::INTERVAL
    ) RETURNING id INTO v_offer_id;
    
    -- Find available field staff
    FOR v_field_staff IN 
        SELECT id FROM profiles 
        WHERE role = 'field_staff'
          AND approval_status = 'approved'
    LOOP
        -- Add recipients
        INSERT INTO request_offer_recipients (offer_id, user_id)
        VALUES (v_offer_id, v_field_staff.id);
        
        -- Create notification
        INSERT INTO notifications (
            user_id, title, message, type, action_url
        ) VALUES (
            v_field_staff.id,
            'New Task Available',
            'A new ' || COALESCE((SELECT name FROM maintenance_categories WHERE id = v_request.category_id), 'maintenance') || ' task is available for claiming',
            'task_offer',
            '/requests/' || p_request_id || '?offer=true'
        );
        
        v_recipients_count := v_recipients_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true, 
        'offer_id', v_offer_id,
        'recipients_count', v_recipients_count
    );
END;
$$;

-- Update accept_request_offer function with secure search_path
CREATE OR REPLACE FUNCTION public.accept_request_offer(
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_offer RECORD;
    v_updated_rows INTEGER;
BEGIN
    -- Check if user is field staff
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'field_staff'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;
    
    -- Find active offer for this request where user is a recipient
    SELECT ro.* INTO v_offer
    FROM request_offers ro
    JOIN request_offer_recipients ror ON ro.id = ror.offer_id
    WHERE ro.request_id = p_request_id 
      AND ro.status = 'open'
      AND ro.expires_at > now()
      AND ror.user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found_or_expired');
    END IF;
    
    -- Atomic claim - update maintenance request
    UPDATE maintenance_requests 
    SET assigned_to = auth.uid(),
        assignment_acknowledged_at = now(),
        status = 'assigned',
        updated_at = now()
    WHERE id = p_request_id AND assigned_to IS NULL;
    
    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    
    IF v_updated_rows = 0 THEN
        RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
    END IF;
    
    -- Mark offer as claimed
    UPDATE request_offers
    SET status = 'claimed',
        claimed_by = auth.uid(),
        claimed_at = now(),
        updated_at = now()
    WHERE id = v_offer.id;
    
    -- Mark recipient response as accepted
    UPDATE request_offer_recipients
    SET response = 'accepted',
        responded_at = now()
    WHERE offer_id = v_offer.id AND user_id = auth.uid();
    
    -- Notify supervisors
    INSERT INTO notifications (
        user_id, title, message, type, action_url
    )
    SELECT 
        p.id,
        'Task Claimed',
        (SELECT CONCAT(first_name, ' ', last_name) FROM profiles WHERE id = auth.uid()) || 
        ' has claimed task: ' || (SELECT title FROM maintenance_requests WHERE id = p_request_id),
        'task_claimed',
        '/requests/' || p_request_id
    FROM profiles p
    WHERE p.role IN ('admin', 'ops_supervisor');
    
    RETURN jsonb_build_object('success', true, 'claimed_at', now());
END;
$$;

-- Update decline_request_offer function with secure search_path
CREATE OR REPLACE FUNCTION public.decline_request_offer(
    p_request_id UUID
)
RETURNS JSONB  
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update recipient response to declined
    UPDATE request_offer_recipients
    SET response = 'declined',
        responded_at = now()
    WHERE offer_id = (
        SELECT id FROM request_offers 
        WHERE request_id = p_request_id AND status = 'open'
    ) AND user_id = auth.uid();
    
    RETURN jsonb_build_object('success', true);
END;
$$;