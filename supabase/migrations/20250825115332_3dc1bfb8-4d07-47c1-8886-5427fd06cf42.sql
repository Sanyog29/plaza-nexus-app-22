-- Create request_time_extensions table
CREATE TABLE public.request_time_extensions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  additional_hours INTEGER NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.request_time_extensions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time extensions
CREATE POLICY "Staff can view time extensions" 
ON public.request_time_extensions 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "L1 staff can create time extensions" 
ON public.request_time_extensions 
FOR INSERT 
WITH CHECK (is_staff(auth.uid()) AND requested_by = auth.uid());

CREATE POLICY "L2+ staff can update time extensions" 
ON public.request_time_extensions 
FOR UPDATE 
USING (is_staff(auth.uid()) AND (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'ops_supervisor')
));

-- Add business hours calculation function
CREATE OR REPLACE FUNCTION public.add_business_hours(start_time TIMESTAMP WITH TIME ZONE, hours_to_add INTEGER)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE;
  remaining_hours INTEGER;
  day_start TIME := '10:00:00';
  day_end TIME := '20:00:00';
  hours_today INTEGER;
  end_of_day TIMESTAMP WITH TIME ZONE;
BEGIN
  current_time := start_time;
  remaining_hours := hours_to_add;
  
  -- If start time is outside business hours, move to next business day start
  IF current_time::TIME < day_start THEN
    current_time := current_time::DATE + day_start;
  ELSIF current_time::TIME >= day_end THEN
    current_time := (current_time::DATE + INTERVAL '1 day') + day_start;
  END IF;
  
  -- Skip weekends
  WHILE EXTRACT(DOW FROM current_time) IN (0, 6) LOOP
    current_time := (current_time::DATE + INTERVAL '1 day') + day_start;
  END LOOP;
  
  WHILE remaining_hours > 0 LOOP
    -- Calculate hours available today
    end_of_day := current_time::DATE + day_end;
    hours_today := LEAST(
      remaining_hours,
      EXTRACT(EPOCH FROM (end_of_day - current_time))/3600
    )::INTEGER;
    
    IF hours_today <= 0 THEN
      -- Move to next business day
      current_time := (current_time::DATE + INTERVAL '1 day') + day_start;
      -- Skip weekends
      WHILE EXTRACT(DOW FROM current_time) IN (0, 6) LOOP
        current_time := (current_time::DATE + INTERVAL '1 day') + day_start;
      END LOOP;
    ELSE
      -- Add the hours
      current_time := current_time + (hours_today || ' hours')::INTERVAL;
      remaining_hours := remaining_hours - hours_today;
      
      -- If we've consumed all hours today, move to next business day
      IF current_time::TIME >= day_end AND remaining_hours > 0 THEN
        current_time := (current_time::DATE + INTERVAL '1 day') + day_start;
        -- Skip weekends
        WHILE EXTRACT(DOW FROM current_time) IN (0, 6) LOOP
          current_time := (current_time::DATE + INTERVAL '1 day') + day_start;
        END LOOP;
      END IF;
    END IF;
  END LOOP;
  
  RETURN current_time;
END;
$$;

-- Function to assign and start request
CREATE OR REPLACE FUNCTION public.assign_and_start_request(request_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Check if user is L1 staff
  IF NOT is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only staff can assign requests');
  END IF;
  
  -- Get request details
  SELECT * INTO request_record FROM maintenance_requests WHERE id = request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Request not found');
  END IF;
  
  -- Check if request is available for assignment
  IF request_record.status NOT IN ('pending', 'assigned') THEN
    RETURN jsonb_build_object('error', 'Request is not available for assignment');
  END IF;
  
  -- Assign and start the request
  UPDATE maintenance_requests 
  SET 
    assigned_to = auth.uid(),
    status = 'in_progress',
    assigned_at = CASE WHEN assigned_at IS NULL THEN now() ELSE assigned_at END,
    work_started_at = now(),
    updated_at = now()
  WHERE id = request_id;
  
  -- Create workflow transition
  INSERT INTO request_workflow_transitions (
    request_id, from_status, to_status, changed_by, notes
  ) VALUES (
    request_id, request_record.status, 'in_progress', auth.uid(), 
    'Request assigned and started by technician'
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Request assigned and started successfully');
END;
$$;

-- Function to request time extension
CREATE OR REPLACE FUNCTION public.request_time_extension(
  request_id UUID, 
  additional_hours INTEGER, 
  reason TEXT, 
  notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Check if user is assigned to this request
  SELECT * INTO request_record FROM maintenance_requests WHERE id = request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Request not found');
  END IF;
  
  IF request_record.assigned_to != auth.uid() THEN
    RETURN jsonb_build_object('error', 'You can only request extensions for requests assigned to you');
  END IF;
  
  -- Create time extension request
  INSERT INTO request_time_extensions (
    request_id, requested_by, additional_hours, reason, notes
  ) VALUES (
    request_id, auth.uid(), additional_hours, reason, notes
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Time extension request submitted for approval');
END;
$$;

-- Function to review time extension
CREATE OR REPLACE FUNCTION public.review_time_extension(
  extension_id UUID,
  approved BOOLEAN,
  review_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  extension_record RECORD;
  request_record RECORD;
  new_due_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user is L2+ staff
  IF NOT ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'ops_supervisor')) THEN
    RETURN jsonb_build_object('error', 'Only supervisors and admins can review time extensions');
  END IF;
  
  -- Get extension details
  SELECT * INTO extension_record FROM request_time_extensions WHERE id = extension_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Extension request not found');
  END IF;
  
  IF extension_record.status != 'pending' THEN
    RETURN jsonb_build_object('error', 'Extension has already been reviewed');
  END IF;
  
  -- Update extension status
  UPDATE request_time_extensions 
  SET 
    status = CASE WHEN approved THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = review_notes,
    updated_at = now()
  WHERE id = extension_id;
  
  -- If approved, update the request's SLA breach time
  IF approved THEN
    SELECT * INTO request_record FROM maintenance_requests WHERE id = extension_record.request_id;
    
    -- Calculate new due time using business hours
    new_due_time := add_business_hours(
      COALESCE(request_record.sla_breach_at, request_record.created_at), 
      extension_record.additional_hours
    );
    
    UPDATE maintenance_requests 
    SET 
      sla_breach_at = new_due_time,
      updated_at = now()
    WHERE id = extension_record.request_id;
    
    -- Create workflow transition
    INSERT INTO request_workflow_transitions (
      request_id, from_status, to_status, changed_by, notes
    ) VALUES (
      extension_record.request_id, request_record.status, request_record.status, auth.uid(),
      format('Time extension approved: +%s hours. New due time: %s', 
             extension_record.additional_hours, new_due_time)
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', CASE WHEN approved THEN 'Time extension approved' ELSE 'Time extension rejected' END
  );
END;
$$;

-- Update maintenance_requests to use business hours for initial SLA calculation
CREATE OR REPLACE FUNCTION public.calculate_request_sla_business_hours()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sla_hours INTEGER;
BEGIN
  -- Get SLA hours based on priority (cast enum to text for comparison)
  SELECT 
    CASE NEW.priority::text
      WHEN 'critical' THEN 2
      WHEN 'high' THEN 4
      WHEN 'medium' THEN 24
      WHEN 'low' THEN 72
      ELSE 24
    END INTO sla_hours;
  
  -- Set SLA breach time using business hours calculation
  NEW.sla_breach_at := add_business_hours(NEW.created_at, sla_hours);
  
  RETURN NEW;
END;
$$;

-- Replace the existing SLA calculation trigger
DROP TRIGGER IF EXISTS calculate_request_sla_trigger ON public.maintenance_requests;

CREATE TRIGGER calculate_request_sla_business_hours_trigger
  BEFORE INSERT ON public.maintenance_requests
  FOR EACH ROW 
  EXECUTE FUNCTION public.calculate_request_sla_business_hours();