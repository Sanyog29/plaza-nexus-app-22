
-- Drop the existing function (same signature types, different param name)
DROP FUNCTION IF EXISTS public.complete_request(uuid, text);

-- Recreate with non-ambiguous parameter name
CREATE OR REPLACE FUNCTION public.complete_request(
  p_request_id uuid,
  p_closure_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_request RECORD;
  v_rows_updated integer;
BEGIN
  -- Read the request
  SELECT * INTO v_request
  FROM public.maintenance_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Validate status
  IF v_request.status NOT IN ('assigned', 'in_progress') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request cannot be completed from current status: ' || v_request.status);
  END IF;

  -- Ensure both photos are uploaded
  IF v_request.before_photo_url IS NULL OR v_request.after_photo_url IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Both before and after photos must be uploaded before completing the request');
  END IF;

  -- Authorization: assigned tech or staff
  IF v_request.assigned_to != auth.uid() AND NOT is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized to complete this request');
  END IF;

  -- Simple upsert into ticket_closures
  INSERT INTO public.ticket_closures (request_id, closed_by, before_photo_url, after_photo_url, closed_at)
  VALUES (p_request_id, auth.uid(), v_request.before_photo_url, v_request.after_photo_url, NOW())
  ON CONFLICT (request_id) DO UPDATE
    SET closed_by        = EXCLUDED.closed_by,
        before_photo_url = EXCLUDED.before_photo_url,
        after_photo_url  = EXCLUDED.after_photo_url,
        closed_at        = EXCLUDED.closed_at,
        updated_at       = NOW();

  -- Separate update to maintenance_requests
  UPDATE public.maintenance_requests
  SET status = 'closed',
      completed_at = NOW(),
      closure_reason = p_closure_reason,
      updated_at = NOW()
  WHERE id = p_request_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  IF v_rows_updated = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to update request status');
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Request closed successfully');
END;
$$;
