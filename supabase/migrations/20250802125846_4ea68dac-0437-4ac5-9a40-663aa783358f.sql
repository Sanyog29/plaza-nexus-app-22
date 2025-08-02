-- Create access point control functions
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

-- Add sample feature requests with the correct column name
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  SELECT id INTO admin_user_id FROM public.profiles WHERE role = 'admin' LIMIT 1;
  
  IF admin_user_id IS NOT NULL AND (SELECT COUNT(*) FROM public.feature_requests) = 0 THEN
    INSERT INTO public.feature_requests (requested_by, title, description, category, priority, status, votes)
    VALUES
      (admin_user_id, 'Mobile Security App', 'Develop a mobile application for security guards to manage incidents and patrols on-the-go', 'mobile', 'high', 'under_review', 15),
      (admin_user_id, 'Facial Recognition Integration', 'Integrate facial recognition technology with existing CCTV systems for enhanced security monitoring', 'security', 'high', 'approved', 23),
      (admin_user_id, 'Automated Incident Reporting', 'Implement AI-powered automated incident detection and reporting from security cameras', 'automation', 'medium', 'in_progress', 8);
  END IF;
END
$$;