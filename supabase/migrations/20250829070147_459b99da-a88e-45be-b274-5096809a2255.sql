
BEGIN;

-- 1) Harden the trigger function (set search_path) - logic unchanged
CREATE OR REPLACE FUNCTION public.log_request_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.request_workflow_transitions (
      request_id, from_status, to_status, changed_by, notes, metadata, changed_at
    ) VALUES (
      NEW.id, NULL, NEW.status, auth.uid(), NULL,
      jsonb_build_object('source','trigger'), now()
    );

  ELSIF TG_OP = 'UPDATE' AND (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.request_workflow_transitions (
      request_id, from_status, to_status, changed_by, notes, metadata, changed_at
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid(), NULL,
      jsonb_build_object('source','trigger'), now()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Recreate the trigger as AFTER so parent row exists before child insert
DROP TRIGGER IF EXISTS tr_log_request_status_transition ON public.maintenance_requests;

CREATE TRIGGER tr_log_request_status_transition
AFTER INSERT OR UPDATE OF status ON public.maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION public.log_request_status_transition();

-- 3) Make FK deferrable to prevent timing issues within the same transaction
ALTER TABLE public.request_workflow_transitions
  ALTER CONSTRAINT request_workflow_transitions_request_id_fkey
  DEFERRABLE INITIALLY DEFERRED;

COMMIT;
