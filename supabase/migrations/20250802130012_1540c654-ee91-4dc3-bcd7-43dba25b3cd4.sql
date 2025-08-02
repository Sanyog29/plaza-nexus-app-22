-- Just create the access control function for now
CREATE OR REPLACE FUNCTION public.toggle_access_point_lock(point_id UUID, lock_state BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has permission
  IF NOT is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only staff can control access points';
  END IF;
  
  -- Update the access point
  UPDATE public.access_points 
  SET is_locked = lock_state,
      last_activity = now(),
      updated_at = now()
  WHERE id = point_id;
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(),
    CASE WHEN lock_state THEN 'lock_access_point' ELSE 'unlock_access_point' END,
    'access_point',
    point_id,
    jsonb_build_object('is_locked', lock_state, 'controlled_by', auth.uid())
  );
  
  RETURN FOUND;
END;
$$;