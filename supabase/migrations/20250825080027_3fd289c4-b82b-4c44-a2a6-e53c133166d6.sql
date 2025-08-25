-- Create request offers system for L1 staff broadcast and claim functionality

-- Create request_offers table
CREATE TABLE public.request_offers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    category_id UUID REFERENCES public.maintenance_categories(id),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    claimed_by UUID REFERENCES public.profiles(id),
    claimed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create request_offer_recipients table
CREATE TABLE public.request_offer_recipients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    offer_id UUID NOT NULL REFERENCES public.request_offers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    notified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    response TEXT NOT NULL DEFAULT 'none' CHECK (response IN ('none', 'accepted', 'declined')),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on both tables
ALTER TABLE public.request_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_offer_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for request_offers
CREATE POLICY "Staff can view offers they are recipients of"
ON public.request_offers
FOR SELECT
USING (
    is_staff(auth.uid()) OR 
    EXISTS (
        SELECT 1 FROM public.request_offer_recipients 
        WHERE offer_id = request_offers.id AND user_id = auth.uid()
    )
);

-- RLS policies for request_offer_recipients  
CREATE POLICY "Users can view their own recipient records"
ON public.request_offer_recipients
FOR SELECT
USING (user_id = auth.uid() OR is_staff(auth.uid()));

-- Function to broadcast request offers to field staff
CREATE OR REPLACE FUNCTION public.broadcast_request_offer(
    p_request_id UUID,
    p_expires_in_minutes INTEGER DEFAULT 2
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request RECORD;
    v_offer_id UUID;
    v_field_staff RECORD;
    v_recipients_count INTEGER := 0;
BEGIN
    -- Validate request exists and is available for assignment
    SELECT * INTO v_request
    FROM public.maintenance_requests
    WHERE id = p_request_id 
      AND status IN ('pending', 'open') 
      AND assigned_to IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_available');
    END IF;
    
    -- Create the offer
    INSERT INTO public.request_offers (
        request_id, category_id, expires_at
    ) VALUES (
        p_request_id, 
        v_request.category_id,
        now() + (p_expires_in_minutes || ' minutes')::INTERVAL
    ) RETURNING id INTO v_offer_id;
    
    -- Find available field staff
    FOR v_field_staff IN 
        SELECT id FROM public.profiles 
        WHERE role = 'field_staff'
          AND approval_status = 'approved'
    LOOP
        -- Add recipients
        INSERT INTO public.request_offer_recipients (offer_id, user_id)
        VALUES (v_offer_id, v_field_staff.id);
        
        -- Create notification
        INSERT INTO public.notifications (
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

-- Function to accept request offers
CREATE OR REPLACE FUNCTION public.accept_request_offer(
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_offer RECORD;
    v_updated_rows INTEGER;
BEGIN
    -- Check if user is field staff
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'field_staff'
    ) THEN
        RETURN jsonb_build_object('success', false, 'reason', 'not_authorized');
    END IF;
    
    -- Find active offer for this request where user is a recipient
    SELECT ro.* INTO v_offer
    FROM public.request_offers ro
    JOIN public.request_offer_recipients ror ON ro.id = ror.offer_id
    WHERE ro.request_id = p_request_id 
      AND ro.status = 'open'
      AND ro.expires_at > now()
      AND ror.user_id = auth.uid();
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'offer_not_found_or_expired');
    END IF;
    
    -- Atomic claim - update maintenance request
    UPDATE public.maintenance_requests 
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
    UPDATE public.request_offers
    SET status = 'claimed',
        claimed_by = auth.uid(),
        claimed_at = now(),
        updated_at = now()
    WHERE id = v_offer.id;
    
    -- Mark recipient response as accepted
    UPDATE public.request_offer_recipients
    SET response = 'accepted',
        responded_at = now()
    WHERE offer_id = v_offer.id AND user_id = auth.uid();
    
    -- Notify supervisors
    INSERT INTO public.notifications (
        user_id, title, message, type, action_url
    )
    SELECT 
        p.id,
        'Task Claimed',
        (SELECT CONCAT(first_name, ' ', last_name) FROM profiles WHERE id = auth.uid()) || 
        ' has claimed task: ' || (SELECT title FROM maintenance_requests WHERE id = p_request_id),
        'task_claimed',
        '/requests/' || p_request_id
    FROM public.profiles p
    WHERE p.role IN ('admin', 'ops_supervisor');
    
    RETURN jsonb_build_object('success', true, 'claimed_at', now());
END;
$$;

-- Function to decline request offers
CREATE OR REPLACE FUNCTION public.decline_request_offer(
    p_request_id UUID
)
RETURNS JSONB  
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update recipient response to declined
    UPDATE public.request_offer_recipients
    SET response = 'declined',
        responded_at = now()
    WHERE offer_id = (
        SELECT id FROM public.request_offers 
        WHERE request_id = p_request_id AND status = 'open'
    ) AND user_id = auth.uid();
    
    RETURN jsonb_build_object('success', true);
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_request_offers_status_expires ON public.request_offers(status, expires_at);
CREATE INDEX idx_request_offer_recipients_user_response ON public.request_offer_recipients(user_id, response);
CREATE INDEX idx_request_offers_request_id ON public.request_offers(request_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_request_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_request_offers_updated_at
    BEFORE UPDATE ON public.request_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_request_offers_updated_at();