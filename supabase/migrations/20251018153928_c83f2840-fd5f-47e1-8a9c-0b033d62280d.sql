-- Continue fixing Function Search Path Mutable security issue
-- Add SET search_path = public to remaining functions (part 2 of 2)

-- Fix all remaining plpgsql and sql functions
CREATE OR REPLACE FUNCTION public.can_view_sensitive_profile_data(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  IF is_admin(auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  IF is_staff(auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_pickup_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  RETURN UPPER(substring(md5(random()::text), 1, 6));
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_pickup_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.pickup_code IS NULL THEN
    NEW.pickup_code := public.generate_pickup_code();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_visitor_qr_data(visitor_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  visitor_data RECORD;
  qr_data JSONB;
BEGIN
  SELECT v.*, vc.name as category_name, vc.icon as category_icon
  INTO visitor_data
  FROM visitors v
  LEFT JOIN visitor_categories vc ON v.category_id = vc.id
  WHERE v.id = visitor_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visitor not found';
  END IF;
  
  qr_data := jsonb_build_object(
    'visitor_id', visitor_data.id,
    'name', visitor_data.name,
    'company', visitor_data.company,
    'visit_date', visitor_data.visit_date,
    'entry_time', visitor_data.entry_time,
    'visit_purpose', visitor_data.visit_purpose,
    'approval_status', visitor_data.approval_status,
    'access_level', visitor_data.access_level,
    'category', visitor_data.category_name,
    'generated_at', now()
  );
  
  RETURN qr_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_order_items_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_maintenance_processes_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_workflow_execution(rule_id text, context jsonb, log_entry jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    execution_id UUID;
BEGIN
    INSERT INTO public.workflow_executions (workflow_rule_id, trigger_context, execution_log)
    VALUES (rule_id, context, JSONB_BUILD_ARRAY(log_entry))
    RETURNING id INTO execution_id;
    
    RETURN execution_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_photos_before_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
  IF NEW.status::text = 'completed' THEN
    IF NEW.before_photo_url IS NULL OR NEW.after_photo_url IS NULL THEN
      RAISE EXCEPTION 'Cannot complete ticket without before and after photos';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_room_availability_data(target_date date)
 RETURNS TABLE(room_id uuid, start_time timestamp with time zone, end_time timestamp with time zone, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    rb.room_id,
    rb.start_time,
    rb.end_time,
    rb.status
  FROM public.room_bookings rb
  WHERE rb.start_time::date = target_date 
    AND rb.status = 'confirmed';
END;
$function$;

CREATE OR REPLACE FUNCTION public.start_security_shift()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  shift_id UUID;
  active_shifts INTEGER;
BEGIN
  IF NOT is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only staff can start shifts';
  END IF;
  
  SELECT COUNT(*) INTO active_shifts
  FROM security_shifts
  WHERE guard_id = auth.uid() AND shift_end IS NULL;
  
  IF active_shifts > 0 THEN
    RAISE EXCEPTION 'Guard already has an active shift';
  END IF;
  
  INSERT INTO security_shifts (guard_id)
  VALUES (auth.uid())
  RETURNING id INTO shift_id;
  
  RETURN shift_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.end_security_shift(handover_notes text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only staff can end shifts';
  END IF;
  
  UPDATE security_shifts
  SET shift_end = now(),
      handover_notes = COALESCE(end_security_shift.handover_notes, handover_notes),
      updated_at = now()
  WHERE guard_id = auth.uid() AND shift_end IS NULL;
  
  RETURN FOUND;
END;
$function$;