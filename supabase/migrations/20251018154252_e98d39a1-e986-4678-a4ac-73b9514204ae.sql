-- Final comprehensive fix for Function Search Path Mutable - Part 4
-- Add SET search_path = public to all remaining critical functions

CREATE OR REPLACE FUNCTION public.log_audit_event(action_type text, resource_type text, resource_id uuid DEFAULT NULL::uuid, old_values jsonb DEFAULT NULL::jsonb, new_values jsonb DEFAULT NULL::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
  VALUES (auth.uid(), action_type, resource_type, resource_id, old_values, new_values)
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_enhanced_staff_availability(new_status availability_status_type, auto_offline_minutes integer DEFAULT NULL::integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  auto_offline_time TIMESTAMP WITH TIME ZONE;
BEGIN
  IF auto_offline_minutes IS NOT NULL AND auto_offline_minutes > 0 THEN
    auto_offline_time := NOW() + (auto_offline_minutes || ' minutes')::INTERVAL;
  END IF;

  INSERT INTO enhanced_staff_availability (staff_id, availability_status, is_available, auto_offline_at, last_status_change)
  VALUES (
    auth.uid(), 
    new_status, 
    CASE WHEN new_status = 'available' THEN true ELSE false END,
    auto_offline_time,
    NOW()
  )
  ON CONFLICT (staff_id) DO UPDATE SET
    availability_status = EXCLUDED.availability_status,
    is_available = EXCLUDED.is_available,
    auto_offline_at = EXCLUDED.auto_offline_at,
    last_status_change = EXCLUDED.last_status_change,
    updated_at = NOW();

  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.broadcast_request_offer(p_request_id uuid, p_expires_in_minutes integer DEFAULT 2)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    v_request RECORD;
    v_offer_id UUID;
    v_field_staff RECORD;
    v_recipients_count INTEGER := 0;
BEGIN
    SELECT * INTO v_request
    FROM maintenance_requests
    WHERE id = p_request_id 
      AND status = 'pending'
      AND assigned_to IS NULL;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'reason', 'request_not_available');
    END IF;
    
    INSERT INTO request_offers (
        request_id, category_id, expires_at
    ) VALUES (
        p_request_id, 
        v_request.category_id,
        now() + (p_expires_in_minutes || ' minutes')::INTERVAL
    ) RETURNING id INTO v_offer_id;
    
    FOR v_field_staff IN 
        SELECT id FROM profiles 
        WHERE role = 'field_staff'
          AND approval_status = 'approved'
    LOOP
        INSERT INTO request_offer_recipients (offer_id, user_id)
        VALUES (v_offer_id, v_field_staff.id);
        
        INSERT INTO notifications (
            user_id, title, message, type, action_url
        ) VALUES (
            v_field_staff.id,
            'New Task Available',
            'A new ' || COALESCE((SELECT name FROM maintenance_categories WHERE id = v_request.category_id), 'maintenance') || ' task is available for claiming',
            'task_offer',
            '/requests/' || p_request_id || '?offer=true'
        );
        
        v_recipients_count := v_recipients_count + 1;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true, 
        'offer_id', v_offer_id,
        'recipients_count', v_recipients_count
    );
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_recurring_bookings(base_booking_id uuid, recurrence_rule jsonb, end_date date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  base_booking RECORD;
  recurring_date DATE;
  new_start_time TIMESTAMP WITH TIME ZONE;
  new_end_time TIMESTAMP WITH TIME ZONE;
  interval_days INTEGER;
  created_count INTEGER := 0;
BEGIN
  SELECT * INTO base_booking 
  FROM room_bookings 
  WHERE id = base_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Base booking not found';
  END IF;
  
  interval_days := CASE 
    WHEN recurrence_rule->>'frequency' = 'daily' THEN 1
    WHEN recurrence_rule->>'frequency' = 'weekly' THEN 7
    WHEN recurrence_rule->>'frequency' = 'monthly' THEN 30
    ELSE 7
  END;
  
  recurring_date := (base_booking.start_time::DATE) + interval_days;
  
  WHILE recurring_date <= end_date LOOP
    new_start_time := recurring_date + (base_booking.start_time::TIME);
    new_end_time := recurring_date + (base_booking.end_time::TIME);
    
    IF NOT EXISTS (
      SELECT 1 FROM room_bookings 
      WHERE room_id = base_booking.room_id 
      AND status = 'confirmed'
      AND (
        (new_start_time >= start_time AND new_start_time < end_time) OR
        (new_end_time > start_time AND new_end_time <= end_time) OR
        (new_start_time <= start_time AND new_end_time >= end_time)
      )
    ) THEN
      INSERT INTO room_bookings (
        room_id, user_id, start_time, end_time, title, description,
        status, duration_minutes, is_recurring, recurrence_rule,
        parent_booking_id, template_id, buffer_time_minutes,
        meeting_agenda, attendee_count, equipment_needed
      ) VALUES (
        base_booking.room_id, base_booking.user_id, 
        new_start_time, new_end_time, base_booking.title, 
        base_booking.description, 'confirmed', base_booking.duration_minutes,
        TRUE, recurrence_rule, base_booking_id, base_booking.template_id,
        base_booking.buffer_time_minutes, base_booking.meeting_agenda,
        base_booking.attendee_count, base_booking.equipment_needed
      );
      
      created_count := created_count + 1;
    END IF;
    
    recurring_date := recurring_date + interval_days;
  END LOOP;
  
  RETURN created_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_recent_sla_breaches(days_back integer DEFAULT 30)
 RETURNS TABLE(id uuid, request_id uuid, escalation_type text, penalty_amount numeric, escalation_reason text, created_at timestamp with time zone, metadata jsonb, request_title text, request_priority text, request_status text, request_sla_breach_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        el.id,
        el.request_id,
        el.escalation_type,
        el.penalty_amount,
        el.escalation_reason,
        el.created_at,
        el.metadata,
        mr.title as request_title,
        mr.priority::TEXT as request_priority,
        mr.status::TEXT as request_status,
        mr.sla_breach_at as request_sla_breach_at
    FROM escalation_logs el
    JOIN maintenance_requests mr ON el.request_id = mr.id
    WHERE el.created_at >= (NOW() - (days_back || ' days')::INTERVAL)
    ORDER BY el.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_cascade_delete_user_data(target_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  BEGIN DELETE FROM public.vendor_staff WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.dietary_preferences WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.delivery_notifications WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN UPDATE public.deliveries SET received_by = NULL WHERE received_by = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN UPDATE public.deliveries SET logged_by = NULL WHERE logged_by = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN UPDATE public.deliveries SET pickup_by = NULL WHERE pickup_by = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.communication_messages WHERE sender_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN UPDATE public.communication_threads SET participants = participants - target_user_id::text WHERE participants ? (target_user_id::text); EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.communication_threads WHERE created_by = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.cafeteria_orders WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; WHEN undefined_column THEN NULL; END;

  DELETE FROM public.profiles WHERE id = target_user_id;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_vendor_daily_analytics()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  vendor_record RECORD;
  analytics_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  FOR vendor_record IN SELECT id FROM vendors WHERE is_active = true LOOP
    INSERT INTO vendor_analytics (
      vendor_id, metric_date, total_orders, total_revenue, 
      average_order_value, total_items_sold, customer_satisfaction_avg
    )
    SELECT 
      vendor_record.id,
      analytics_date,
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as average_order_value,
      COALESCE(SUM((
        SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = co.id
      )), 0) as total_items_sold,
      COALESCE((
        SELECT AVG(overall_rating) FROM order_feedback of WHERE of.vendor_id = vendor_record.id
        AND DATE(of.created_at) = analytics_date
      ), 0) as customer_satisfaction_avg
    FROM cafeteria_orders co
    WHERE co.vendor_id = vendor_record.id
    AND DATE(co.created_at) = analytics_date
    AND co.status = 'completed'
    GROUP BY vendor_record.id
    ON CONFLICT (vendor_id, metric_date) 
    DO UPDATE SET
      total_orders = EXCLUDED.total_orders,
      total_revenue = EXCLUDED.total_revenue,
      average_order_value = EXCLUDED.average_order_value,
      total_items_sold = EXCLUDED.total_items_sold,
      customer_satisfaction_avg = EXCLUDED.customer_satisfaction_avg;
  END LOOP;
END;
$function$;