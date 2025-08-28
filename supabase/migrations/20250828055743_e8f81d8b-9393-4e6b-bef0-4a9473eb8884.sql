
-- 1) Add simplified lifecycle columns to maintenance_requests
ALTER TABLE public.maintenance_requests
  ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid,
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS closure_reason text,
  ADD COLUMN IF NOT EXISTS before_photo_url text,
  ADD COLUMN IF NOT EXISTS after_photo_url text,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Optional: backfill from legacy columns if they exist (assigned_to, assigned_at, work_started_at)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='maintenance_requests' AND column_name='assigned_to'
  ) THEN
    EXECUTE $sql$
      UPDATE public.maintenance_requests
      SET assigned_to_user_id = COALESCE(assigned_to_user_id, assigned_to)
      WHERE assigned_to IS NOT NULL AND assigned_to_user_id IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='maintenance_requests' AND column_name='assigned_at'
  ) THEN
    EXECUTE $sql$
      UPDATE public.maintenance_requests
      SET accepted_at = COALESCE(accepted_at, assigned_at)
      WHERE assigned_at IS NOT NULL AND accepted_at IS NULL
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='maintenance_requests' AND column_name='work_started_at'
  ) THEN
    EXECUTE $sql$
      UPDATE public.maintenance_requests
      SET started_at = COALESCE(started_at, work_started_at)
      WHERE work_started_at IS NOT NULL AND started_at IS NULL
    $sql$;
  END IF;
END
$$;

-- 2) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_mr_assigned_to_user_id ON public.maintenance_requests(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_mr_status ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_mr_completed_at ON public.maintenance_requests(completed_at);

-- 3) Remove points-related tables (if they exist)
DROP TABLE IF EXISTS public.point_transactions;
DROP TABLE IF EXISTS public.technician_points;

-- 4) Update status tracking trigger function to also set completed_at on 'closed'
CREATE OR REPLACE FUNCTION public.track_request_status_change()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status::text != NEW.status::text) THEN
    -- Insert status history (changed_by may be null if called by system processes)
    IF auth.uid() IS NOT NULL THEN
      INSERT INTO request_status_history (request_id, status, changed_by)
      VALUES (NEW.id, NEW.status, auth.uid());
    ELSE
      INSERT INTO request_status_history (request_id, status, changed_by)
      VALUES (NEW.id, NEW.status, NULL);
    END IF;
  END IF;

  -- If status changed to completed or closed, set completed_at timestamp
  IF NEW.status::text IN ('completed', 'closed') 
     AND (TG_OP = 'INSERT' OR OLD.status::text NOT IN ('completed', 'closed')) THEN
    NEW.completed_at := NOW();
  END IF;

  -- Always update the updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$function$;

-- 5) Enforce photos before closing via trigger (prevents accidental closure without photos)
CREATE OR REPLACE FUNCTION public.ensure_photos_before_close()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status::text = 'closed' THEN
    IF NEW.before_photo_url IS NULL OR NEW.after_photo_url IS NULL THEN
      RAISE EXCEPTION 'Cannot close ticket without before and after photos';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_ensure_photos_before_close ON public.maintenance_requests;

CREATE TRIGGER trg_ensure_photos_before_close
BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW
WHEN (OLD.status::text IS DISTINCT FROM NEW.status::text)
EXECUTE FUNCTION public.ensure_photos_before_close();

-- 6) Simple analytics views

-- 6a) Tickets closed per technician
CREATE OR REPLACE VIEW public.v_tickets_closed_per_technician AS
SELECT
  COALESCE(closed_by_user_id, assigned_to_user_id) AS technician_id,
  COUNT(*) AS tickets_closed
FROM public.maintenance_requests
WHERE status::text = 'closed'
GROUP BY COALESCE(closed_by_user_id, assigned_to_user_id);

-- 6b) Resolution metrics (avg resolution time, SLA compliance) per technician
CREATE OR REPLACE VIEW public.v_request_resolution_metrics AS
SELECT
  COALESCE(closed_by_user_id, assigned_to_user_id) AS technician_id,
  COUNT(*) FILTER (WHERE status::text = 'closed') AS total_closed,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60.0) FILTER (WHERE completed_at IS NOT NULL) AS avg_resolution_minutes,
  100.0 * (
    SUM(CASE WHEN completed_at IS NOT NULL AND (sla_breach_at IS NULL OR completed_at <= sla_breach_at) THEN 1 ELSE 0 END)::decimal
    / NULLIF(COUNT(*) FILTER (WHERE status::text = 'closed'), 0)
  ) AS sla_compliance_percent
FROM public.maintenance_requests
GROUP BY COALESCE(closed_by_user_id, assigned_to_user_id);
