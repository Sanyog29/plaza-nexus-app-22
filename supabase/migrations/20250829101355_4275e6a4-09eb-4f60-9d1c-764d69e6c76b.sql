-- Fix the workflow state sync issue
-- First, let's fix the trigger to properly handle photo status
DROP TRIGGER IF EXISTS update_workflow_state_trigger ON maintenance_requests;
DROP FUNCTION IF EXISTS public.update_workflow_state() CASCADE;

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
    CASE WHEN NEW.before_photo_url IS NOT NULL AND NEW.before_photo_url != '' THEN true ELSE false END,
    CASE WHEN NEW.after_photo_url IS NOT NULL AND NEW.after_photo_url != '' THEN true ELSE false END
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
    before_photos_uploaded = CASE WHEN NEW.before_photo_url IS NOT NULL AND NEW.before_photo_url != '' THEN true ELSE false END,
    after_photos_uploaded = CASE WHEN NEW.after_photo_url IS NOT NULL AND NEW.after_photo_url != '' THEN true ELSE false END,
    completed_at = CASE WHEN NEW.status = 'completed' THEN COALESCE(NEW.completed_at, NOW()) ELSE request_workflow_states.completed_at END,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_workflow_state_trigger
  AFTER INSERT OR UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_state();

-- Now sync all existing data to fix inconsistencies
UPDATE request_workflow_states rws
SET 
  before_photos_uploaded = CASE 
    WHEN mr.before_photo_url IS NOT NULL AND mr.before_photo_url != '' THEN true 
    ELSE false 
  END,
  after_photos_uploaded = CASE 
    WHEN mr.after_photo_url IS NOT NULL AND mr.after_photo_url != '' THEN true 
    ELSE false 
  END,
  current_stage = CASE 
    WHEN mr.status = 'pending' THEN 'pending'
    WHEN mr.status = 'assigned' THEN 'assigned'
    WHEN mr.status = 'in_progress' THEN 'in_progress'
    WHEN mr.status = 'completed' THEN 'completed'
    ELSE 'pending'
  END,
  updated_at = NOW()
FROM maintenance_requests mr
WHERE rws.request_id = mr.id;