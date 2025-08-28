
-- 1) Ensure before/after photo columns exist, plus an optional closure_reason
ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS before_photo_url text,
  ADD COLUMN IF NOT EXISTS after_photo_url text,
  ADD COLUMN IF NOT EXISTS closure_reason text;

-- 2) Enforce photos before completion at the DB level
-- Drop any previous trigger that enforced photos on 'closed' (non-existent in our enum)
DROP TRIGGER IF EXISTS trg_ensure_photos_before_close ON public.maintenance_requests;

-- Create or replace a trigger function that enforces photos before 'completed'
CREATE OR REPLACE FUNCTION public.ensure_photos_before_complete()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status::text = 'completed' THEN
    IF NEW.before_photo_url IS NULL OR NEW.after_photo_url IS NULL THEN
      RAISE EXCEPTION 'Cannot complete ticket without before and after photos';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Attach the trigger to maintenance_requests
DROP TRIGGER IF EXISTS trg_require_photos_before_complete ON public.maintenance_requests;
CREATE TRIGGER trg_require_photos_before_complete
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_photos_before_complete();

-- 3) Fix the broadcast function to use only valid statuses (remove 'open')
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
      AND status = 'pending'
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
  