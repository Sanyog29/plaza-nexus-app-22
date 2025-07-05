-- Fix the trigger function to handle null auth.uid() cases
CREATE OR REPLACE FUNCTION public.track_request_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status != NEW.status) THEN
    -- Only insert status history if we have a valid user ID, otherwise skip the changed_by field
    IF auth.uid() IS NOT NULL THEN
      INSERT INTO request_status_history (request_id, status, changed_by)
      VALUES (NEW.id, NEW.status, auth.uid());
    ELSE
      INSERT INTO request_status_history (request_id, status, changed_by)
      VALUES (NEW.id, NEW.status, NULL);
    END IF;
  END IF;
  
  -- If status changed to completed, set completed_at timestamp
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status != 'completed') THEN
    NEW.completed_at := NOW();
  END IF;
  
  -- Always update the updated_at timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$function$;