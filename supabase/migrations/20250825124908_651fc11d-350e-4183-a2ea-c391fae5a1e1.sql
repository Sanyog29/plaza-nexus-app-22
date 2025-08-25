
-- Replace assign_and_start_request to use a single conditional update (no upsert/on conflict)
-- Supabase project: mukqpwinqhdfffdkthcg

CREATE OR REPLACE FUNCTION public.assign_and_start_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated integer;
  current_status maintenance_requests.status%TYPE;
BEGIN
  -- Only staff can self-assign
  IF NOT is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('error','not_staff','message','Only staff can assign requests');
  END IF;

  -- Read current status to help craft accurate error messages
  SELECT status
  INTO current_status
  FROM maintenance_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','not_found','message','Request not found');
  END IF;

  -- Atomic claim + start: will only succeed if unassigned and in a claimable status
  UPDATE maintenance_requests
  SET
    assigned_to     = auth.uid(),
    assigned_at     = COALESCE(assigned_at, now()),
    status          = 'in_progress',
    work_started_at = now()
  WHERE id = p_request_id
    AND assigned_to IS NULL
    AND status IN ('pending','assigned');

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated = 0 THEN
    -- Determine the cause
    IF EXISTS (SELECT 1 FROM maintenance_requests WHERE id = p_request_id AND assigned_to IS NOT NULL) THEN
      RETURN jsonb_build_object('error','already_assigned','message','This request has already been claimed by another technician');
    ELSIF EXISTS (SELECT 1 FROM maintenance_requests WHERE id = p_request_id AND status NOT IN ('pending','assigned')) THEN
      RETURN jsonb_build_object('error','invalid_status','message','Request is not available for assignment');
    ELSE
      RETURN jsonb_build_object('error','not_found','message','Request not found');
    END IF;
  END IF;

  -- Status history will be captured by existing triggers if present; no extra writes required here
  RETURN jsonb_build_object('success', true, 'message', 'Request assigned to you and started');
END;
$$;

-- Optional: update the 2-arg variant for parity (assign specific staff) with the same conditional logic
CREATE OR REPLACE FUNCTION public.assign_and_start_request(p_request_id uuid, p_staff_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rows_updated integer;
  current_status maintenance_requests.status%TYPE;
BEGIN
  -- Only staff can assign
  IF NOT is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('error','not_staff','message','Only staff can assign requests');
  END IF;

  -- Validate target staff is also staff
  IF NOT is_staff(p_staff_id) THEN
    RETURN jsonb_build_object('error','invalid_staff','message','Target user must be staff');
  END IF;

  -- Read current status
  SELECT status
  INTO current_status
  FROM maintenance_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','not_found','message','Request not found');
  END IF;

  -- Atomic claim for a specific staff member
  UPDATE maintenance_requests
  SET
    assigned_to     = p_staff_id,
    assigned_at     = COALESCE(assigned_at, now()),
    status          = 'in_progress',
    work_started_at = now()
  WHERE id = p_request_id
    AND assigned_to IS NULL
    AND status IN ('pending','assigned');

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated = 0 THEN
    IF EXISTS (SELECT 1 FROM maintenance_requests WHERE id = p_request_id AND assigned_to IS NOT NULL) THEN
      RETURN jsonb_build_object('error','already_assigned','message','This request has already been claimed by another technician');
    ELSIF EXISTS (SELECT 1 FROM maintenance_requests WHERE id = p_request_id AND status NOT IN ('pending','assigned')) THEN
      RETURN jsonb_build_object('error','invalid_status','message','Request is not available for assignment');
    ELSE
      RETURN jsonb_build_object('error','not_found','message','Request not found');
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Request assigned and started');
END;
$$;
