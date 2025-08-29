-- Fix the update_workflow_state trigger function to include proper search path
DROP FUNCTION IF EXISTS public.update_workflow_state();

CREATE OR REPLACE FUNCTION public.update_workflow_state()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update or insert workflow state when maintenance request changes
  INSERT INTO request_workflow_states (
    request_id,
    current_stage,
    technician_id,
    started_at,
    before_photos_required,
    after_photos_required,
    before_photos_uploaded,
    after_photos_uploaded
  ) VALUES (
    NEW.id,
    CASE 
      WHEN NEW.status = 'pending' THEN 'pending'
      WHEN NEW.status = 'assigned' THEN 'assigned'
      WHEN NEW.status = 'in_progress' THEN 'in_progress'
      WHEN NEW.status = 'completed' THEN 'completed'
      ELSE 'pending'
    END,
    NEW.assigned_to,
    CASE WHEN NEW.work_started_at IS NOT NULL THEN NEW.work_started_at ELSE NULL END,
    true, -- before photos required by default
    true, -- after photos required by default
    CASE WHEN NEW.before_photo_url IS NOT NULL THEN true ELSE false END,
    CASE WHEN NEW.after_photo_url IS NOT NULL THEN true ELSE false END
  )
  ON CONFLICT (request_id) 
  DO UPDATE SET
    current_stage = CASE 
      WHEN NEW.status = 'pending' THEN 'pending'
      WHEN NEW.status = 'assigned' THEN 'assigned'
      WHEN NEW.status = 'in_progress' THEN 'in_progress'
      WHEN NEW.status = 'completed' THEN 'completed'
      ELSE 'pending'
    END,
    technician_id = NEW.assigned_to,
    started_at = CASE WHEN NEW.work_started_at IS NOT NULL THEN NEW.work_started_at ELSE request_workflow_states.started_at END,
    before_photos_uploaded = CASE WHEN NEW.before_photo_url IS NOT NULL THEN true ELSE request_workflow_states.before_photos_uploaded END,
    after_photos_uploaded = CASE WHEN NEW.after_photo_url IS NOT NULL THEN true ELSE request_workflow_states.after_photos_uploaded END,
    completed_at = CASE WHEN NEW.status = 'completed' THEN COALESCE(NEW.completed_at, NOW()) ELSE request_workflow_states.completed_at END,
    updated_at = NOW();

  RETURN NEW;
END;
$$;