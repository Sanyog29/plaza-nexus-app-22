-- SECURITY FIX 1: Remove role column from profiles table
-- Roles must ONLY be stored in user_roles table to prevent privilege escalation

-- Drop the role column from profiles (CASCADE will handle dependencies)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role CASCADE;

-- Remove the sync_profile_role trigger if it exists
DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.user_roles;
DROP FUNCTION IF EXISTS public.sync_profile_role() CASCADE;

-- SECURITY FIX 2: Add search_path protection to all SECURITY DEFINER functions
-- This prevents SQL injection via schema manipulation attacks

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role = 'admin'
  );
$$;

-- Fix is_staff function
CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = $1
      AND role IN (
        'admin',
        'ops_supervisor',
        'field_staff',
        'mst',
        'fe',
        'staff',
        'hk',
        'se',
        'assistant_manager',
        'assistant_floor_manager',
        'assistant_general_manager',
        'assistant_vice_president',
        'vp',
        'cxo',
        'ceo',
        'tenant_manager',
        'super_tenant'
      )
  );
$$;

-- Fix is_food_vendor function
CREATE OR REPLACE FUNCTION public.is_food_vendor(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND user_category = 'food_vendor'
  );
$$;

-- Fix is_l2 function
CREATE OR REPLACE FUNCTION public.is_l2(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role IN ('assistant_manager', 'assistant_floor_manager')
  );
$$;

-- Fix is_l3 function
CREATE OR REPLACE FUNCTION public.is_l3(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role IN ('assistant_general_manager', 'assistant_vice_president')
  );
$$;

-- Fix is_l4 function
CREATE OR REPLACE FUNCTION public.is_l4(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = $1 AND role IN ('vp', 'ceo', 'cxo')
  );
$$;

-- Fix is_management function
CREATE OR REPLACE FUNCTION public.is_management(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_l2($1) OR is_l3($1) OR is_l4($1);
$$;

-- Fix log_audit_event function
CREATE OR REPLACE FUNCTION public.log_audit_event(action_type text, resource_type text, resource_id uuid DEFAULT NULL::uuid, old_values jsonb DEFAULT NULL::jsonb, new_values jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
  VALUES (auth.uid(), action_type, resource_type, resource_id, old_values, new_values)
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Fix log_unauthorized_access_attempt function
CREATE OR REPLACE FUNCTION public.log_unauthorized_access_attempt(attempted_table text, attempted_action text, user_category text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    new_values
  ) VALUES (
    auth.uid(),
    'unauthorized_access_attempt',
    'security_violation',
    jsonb_build_object(
      'attempted_table', attempted_table,
      'attempted_action', attempted_action,
      'user_category', COALESCE(user_category, (SELECT profiles.user_category FROM public.profiles WHERE id = auth.uid())),
      'timestamp', now(),
      'ip_address', current_setting('request.jwt.claims', true)::jsonb ->> 'ip'
    )
  );
END;
$$;

-- Fix admin_cascade_delete_user_data function
CREATE OR REPLACE FUNCTION public.admin_cascade_delete_user_data(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix sync_user_email function
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix track_profile_changes function
CREATE OR REPLACE FUNCTION public.track_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW IS DISTINCT FROM OLD) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.profile_audit_logs (
      profile_id,
      changed_by,
      changes,
      action_type
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      auth.uid(),
      CASE 
        WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
          'old', to_jsonb(OLD),
          'new', to_jsonb(NEW)
        )
        ELSE to_jsonb(OLD)
      END,
      LOWER(TG_OP)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fix award_completion_points function
CREATE OR REPLACE FUNCTION public.award_completion_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_points integer := 10;
  priority_multiplier numeric := 1.0;
  speed_bonus integer := 0;
  quality_bonus integer := 0;
  total_points integer;
  completion_hours numeric;
  expected_hours numeric;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    completion_hours := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.created_at))/3600;
    
    expected_hours := CASE NEW.priority
      WHEN 'urgent' THEN 2
      WHEN 'high' THEN 8
      WHEN 'medium' THEN 24
      WHEN 'low' THEN 72
      ELSE 24
    END;
    
    priority_multiplier := CASE NEW.priority
      WHEN 'urgent' THEN 3.0
      WHEN 'high' THEN 2.0
      WHEN 'medium' THEN 1.5
      WHEN 'low' THEN 1.0
      ELSE 1.0
    END;
    
    IF completion_hours <= expected_hours THEN
      speed_bonus := ROUND(base_points * 0.5);
    END IF;
    
    SELECT CASE 
      WHEN before_photos_uploaded AND after_photos_uploaded THEN ROUND(base_points * 0.3)
      ELSE 0
    END INTO quality_bonus
    FROM public.request_workflow_states 
    WHERE request_id = NEW.id;
    
    total_points := ROUND(base_points * priority_multiplier) + speed_bonus + COALESCE(quality_bonus, 0);
    
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO public.point_transactions (
        technician_id, 
        request_id, 
        transaction_type, 
        points, 
        reason,
        metadata
      ) VALUES (
        NEW.assigned_to,
        NEW.id,
        'earned',
        total_points,
        'Ticket completion',
        jsonb_build_object(
          'base_points', base_points,
          'priority_multiplier', priority_multiplier,
          'speed_bonus', speed_bonus,
          'quality_bonus', COALESCE(quality_bonus, 0),
          'completion_hours', completion_hours,
          'expected_hours', expected_hours
        )
      );
      
      INSERT INTO public.technician_points (technician_id, points_earned, points_balance, total_lifetime_points)
      VALUES (NEW.assigned_to, total_points, total_points, total_points)
      ON CONFLICT (technician_id) DO UPDATE SET
        points_earned = technician_points.points_earned + total_points,
        points_balance = technician_points.points_balance + total_points,
        total_lifetime_points = technician_points.total_lifetime_points + total_points,
        current_tier = CASE 
          WHEN technician_points.total_lifetime_points + total_points >= 1000 THEN 'gold'
          WHEN technician_points.total_lifetime_points + total_points >= 500 THEN 'silver'
          ELSE 'bronze'
        END,
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix update_photo_upload_status function
CREATE OR REPLACE FUNCTION public.update_photo_upload_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.attachment_type IN ('technician_before', 'technician_after') THEN
    UPDATE public.request_workflow_states
    SET before_photos_uploaded = CASE 
      WHEN NEW.attachment_type = 'technician_before' THEN true
      ELSE before_photos_uploaded
    END,
    after_photos_uploaded = CASE 
      WHEN NEW.attachment_type = 'technician_after' THEN true
      ELSE after_photos_uploaded
    END,
    updated_at = now()
    WHERE request_id = NEW.request_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix check_sla_breaches function
CREATE OR REPLACE FUNCTION public.check_sla_breaches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    request_record RECORD;
    escalation_rule RECORD;
    penalty_amount DECIMAL;
BEGIN
    FOR request_record IN 
        SELECT mr.*, 
               EXTRACT(EPOCH FROM (mr.sla_breach_at - NOW()))/60 as minutes_to_breach,
               EXTRACT(EPOCH FROM (NOW() - mr.sla_breach_at))/60 as minutes_past_breach
        FROM public.maintenance_requests mr
        WHERE mr.status NOT IN ('completed', 'cancelled')
        AND mr.sla_breach_at IS NOT NULL
    LOOP
        IF request_record.minutes_past_breach > 0 THEN
            SELECT amount INTO penalty_amount
            FROM public.service_penalty_matrix 
            WHERE category = 'sla_breach' 
            AND priority = request_record.priority::text;
            
            INSERT INTO public.escalation_logs (
                request_id, 
                escalation_type, 
                escalated_from, 
                escalated_to, 
                penalty_amount,
                escalation_reason,
                metadata
            ) VALUES (
                request_record.id,
                'sla_breach',
                request_record.assigned_to,
                NULL,
                COALESCE(penalty_amount, 0),
                'SLA deadline exceeded',
                jsonb_build_object(
                    'minutes_past_breach', request_record.minutes_past_breach,
                    'original_sla', request_record.sla_breach_at,
                    'breach_time', NOW()
                )
            );
            
            INSERT INTO public.notifications (
                user_id, 
                title, 
                message, 
                type, 
                action_url
            ) 
            SELECT 
                p.id,
                'SLA Breach Alert!',
                format('Request #%s has exceeded SLA by %s minutes. Penalty: $%s', 
                       request_record.id, 
                       ROUND(request_record.minutes_past_breach), 
                       COALESCE(penalty_amount, 0)),
                'critical',
                format('/requests/%s', request_record.id)
            FROM public.profiles p 
            WHERE p.role IN ('admin', 'ops_supervisor');
            
        ELSIF request_record.minutes_to_breach BETWEEN 0 AND 30 THEN
            INSERT INTO public.notifications (
                user_id, 
                title, 
                message, 
                type, 
                action_url
            ) 
            SELECT 
                COALESCE(request_record.assigned_to, p.id),
                'SLA Warning',
                format('Request #%s will breach SLA in %s minutes!', 
                       request_record.id, 
                       ROUND(request_record.minutes_to_breach)),
                'warning',
                format('/requests/%s', request_record.id)
            FROM public.profiles p 
            WHERE p.role IN ('admin', 'ops_supervisor')
            LIMIT 1;
        END IF;
    END LOOP;
END;
$$;

-- Fix get_user_management_stats function
CREATE OR REPLACE FUNCTION public.get_user_management_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Access denied');
  END IF;
  
  SELECT jsonb_build_object(
    'total_users', COUNT(*),
    'verified_users', COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL),
    'pending_users', COUNT(*) FILTER (WHERE confirmed_at IS NULL),
    'approved_users', COUNT(*) FILTER (WHERE approval_status = 'approved'),
    'pending_approval', COUNT(*) FILTER (WHERE approval_status = 'pending'),
    'rejected_users', COUNT(*) FILTER (WHERE approval_status = 'rejected'),
    'admin_users', COUNT(*) FILTER (WHERE role = 'admin'),
    'staff_users', COUNT(*) FILTER (WHERE role IN ('ops_supervisor', 'field_staff')),
    'tenant_users', COUNT(*) FILTER (WHERE role = 'tenant_manager'),
    'vendor_users', COUNT(*) FILTER (WHERE role = 'vendor'),
    'users_without_profiles', (
      SELECT COUNT(*) FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      WHERE p.id IS NULL AND u.deleted_at IS NULL
    )
  ) INTO stats
  FROM (
    SELECT 
      p.*,
      u.confirmed_at,
      ur.role
    FROM public.profiles p
    LEFT JOIN auth.users u ON p.id = u.id
    LEFT JOIN public.user_roles ur ON p.id = ur.user_id
    WHERE u.deleted_at IS NULL
  ) user_data;
  
  RETURN stats;
END;
$$;

-- Fix mark_order_paid_and_complete function
CREATE OR REPLACE FUNCTION public.mark_order_paid_and_complete(p_order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_vendor_id uuid;
  v_user_id uuid;
begin
  select vendor_id, user_id into v_vendor_id, v_user_id
  from public.cafeteria_orders
  where id = p_order_id;

  if not found then
    raise exception 'Order not found';
  end if;

  if not (
    public.is_food_vendor_staff_for_vendor(auth.uid(), v_vendor_id)
    or auth.uid() = v_user_id
    or public.is_admin(auth.uid())
  ) then
    raise exception 'Not authorized to update this order';
  end if;

  update public.cafeteria_orders
  set payment_status = 'paid',
      status = 'completed',
      paid_at = now(),
      updated_at = now()
  where id = p_order_id;

  return found;
end;
$$;

-- Fix assign_and_start_request function
CREATE OR REPLACE FUNCTION public.assign_and_start_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated integer;
  current_status maintenance_requests.status%TYPE;
BEGIN
  IF NOT is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('error','not_staff','message','Only staff can assign requests');
  END IF;

  SELECT status
  INTO current_status
  FROM public.maintenance_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error','not_found','message','Request not found');
  END IF;

  UPDATE public.maintenance_requests
  SET
    assigned_to     = auth.uid(),
    assigned_at     = COALESCE(assigned_at, now()),
    status          = 'in_progress',
    work_started_at = now()
  WHERE id = p_request_id
    AND assigned_to IS NULL
    AND status IN ('pending','assigned');

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated = 0 THEN
    IF EXISTS (SELECT 1 FROM public.maintenance_requests WHERE id = p_request_id AND assigned_to IS NOT NULL) THEN
      RETURN jsonb_build_object('error','already_assigned','message','This request has already been claimed by another technician');
    ELSIF EXISTS (SELECT 1 FROM public.maintenance_requests WHERE id = p_request_id AND status NOT IN ('pending','assigned')) THEN
      RETURN jsonb_build_object('error','invalid_status','message','Request is not available for assignment');
    ELSE
      RETURN jsonb_build_object('error','not_found','message','Request not found');
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Request assigned to you and started');
END;
$$;

-- Fix can_view_sensitive_profile_data function
CREATE OR REPLACE FUNCTION public.can_view_sensitive_profile_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix can_view_profile_sensitive_data function
CREATE OR REPLACE FUNCTION public.can_view_profile_sensitive_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  IF is_admin(auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  IF is_staff(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = target_user_id 
      AND supervisor_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Fix get_full_profile function
CREATE OR REPLACE FUNCTION public.get_full_profile(profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  public_data jsonb;
  sensitive_data jsonb;
  can_view_sensitive boolean;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'first_name', first_name,
    'last_name', last_name,
    'avatar_url', avatar_url,
    'department', department,
    'floor', floor,
    'zone', zone,
    'bio', bio,
    'skills', skills,
    'interests', interests,
    'designation', designation,
    'approval_status', approval_status,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO public_data
  FROM public.profiles
  WHERE id = profile_id;
  
  can_view_sensitive := public.can_view_profile_sensitive_data(profile_id);
  
  IF can_view_sensitive THEN
    INSERT INTO public.sensitive_profile_access_log (
      accessed_by, 
      target_user_id, 
      fields_accessed,
      access_reason
    ) VALUES (
      auth.uid(),
      profile_id,
      ARRAY['email', 'phone_number', 'mobile_number', 'government_id', 'employee_id', 'emergency_contact_name', 'emergency_contact_phone', 'office_number'],
      'Full profile access via get_full_profile function'
    );
    
    SELECT jsonb_build_object(
      'email', email,
      'phone_number', phone_number,
      'mobile_number', mobile_number,
      'government_id', government_id,
      'employee_id', employee_id,
      'emergency_contact_name', emergency_contact_name,
      'emergency_contact_phone', emergency_contact_phone,
      'emergency_contact_relationship', emergency_contact_relationship,
      'office_number', office_number
    ) INTO sensitive_data
    FROM public.profiles
    WHERE id = profile_id;
    
    RETURN public_data || sensitive_data;
  ELSE
    RETURN public_data;
  END IF;
END;
$$;

-- Fix update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can update roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (user_id, new_role::app_role, auth.uid())
  ON CONFLICT (user_id, role) DO UPDATE
  SET assigned_by = auth.uid(), assigned_at = now();

  RETURN FOUND;
END;
$$;

-- Fix toggle_access_point_lock function
CREATE OR REPLACE FUNCTION public.toggle_access_point_lock(point_id uuid, lock_state boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only staff can control access points';
  END IF;
  
  UPDATE public.access_points 
  SET is_locked = lock_state,
      last_activity = now(),
      updated_at = now()
  WHERE id = point_id;
  
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

-- Fix acknowledge_ticket function
CREATE OR REPLACE FUNCTION public.acknowledge_ticket(ticket_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.maintenance_requests 
    WHERE id = ticket_id AND assigned_to = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to acknowledge this ticket';
  END IF;
  
  UPDATE public.maintenance_requests
  SET assignment_acknowledged_at = NOW(),
      next_escalation_at = CASE 
        WHEN priority = 'critical' THEN NOW() + INTERVAL '2 hours'
        WHEN priority = 'high' THEN NOW() + INTERVAL '4 hours'
        WHEN priority = 'medium' THEN NOW() + INTERVAL '12 hours'
        ELSE NOW() + INTERVAL '48 hours'
      END,
      updated_at = NOW()
  WHERE id = ticket_id;
  
  RETURN FOUND;
END;
$$;

-- Fix get_invitation_details function
CREATE OR REPLACE FUNCTION public.get_invitation_details(token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invitation_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'email', email,
    'first_name', first_name,
    'last_name', last_name,
    'role', role,
    'department', department,
    'expires_at', expires_at,
    'invited_by', invited_by
  ) INTO invitation_data
  FROM public.user_invitations
  WHERE invitation_token = token
    AND status = 'pending';
  
  RETURN invitation_data;
END;
$$;

-- Fix admin_create_user_invitation function  
CREATE OR REPLACE FUNCTION public.admin_create_user_invitation(invitation_email text, invitation_first_name text, invitation_last_name text, invitation_role text, invitation_department text DEFAULT NULL::text, invitation_specialization text DEFAULT NULL::text, invitation_phone_number text DEFAULT NULL::text, invitation_office_number text DEFAULT NULL::text, invitation_floor text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_profile RECORD;
  invitation_id uuid;
  invitation_token uuid;
  role_record RECORD;
  actual_app_role app_role;
  role_title_to_store text;
BEGIN
  SELECT * INTO caller_profile
  FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Only administrators can create user invitations');
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = invitation_email AND deleted_at IS NULL
  ) THEN
    RETURN jsonb_build_object('error', 'User with this email already exists');
  END IF;
  
  SELECT * INTO role_record
  FROM public.invitation_roles
  WHERE (title = invitation_role OR slug = invitation_role) 
    AND is_active = true;
  
  IF FOUND THEN
    actual_app_role := role_record.app_role;
    role_title_to_store := role_record.title;
  ELSE
    IF invitation_role = 'tenant' THEN
      IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'app_role' AND e.enumlabel = 'tenant'
      ) THEN
        actual_app_role := 'tenant'::app_role;
        role_title_to_store := 'Tenant';
      ELSIF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'app_role' AND e.enumlabel = 'tenant_manager'
      ) THEN
        actual_app_role := 'tenant_manager'::app_role;
        role_title_to_store := 'Tenant Manager';
      ELSE
        RETURN jsonb_build_object('error', 'Invalid role specified');
      END IF;
    ELSE
      BEGIN
        actual_app_role := invitation_role::app_role;
        role_title_to_store := invitation_role;
      EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('error', 'Invalid role specified. Role must be from the approved invitation roles list.');
      END;
    END IF;
  END IF;
  
  invitation_token := gen_random_uuid();
  
  INSERT INTO public.user_invitations (
    email,
    first_name,
    last_name,
    role,
    role_title,
    department,
    specialization,
    phone_number,
    office_number,
    floor,
    invitation_token,
    invited_by,
    expires_at
  ) VALUES (
    invitation_email,
    invitation_first_name,
    invitation_last_name,
    actual_app_role,
    role_title_to_store,
    invitation_department,
    invitation_specialization,
    invitation_phone_number,
    invitation_office_number,
    invitation_floor,
    invitation_token,
    auth.uid(),
    now() + interval '7 days'
  ) RETURNING id INTO invitation_id;
  
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(),
    'create_invitation',
    'user_invitation',
    invitation_id,
    jsonb_build_object(
      'email', invitation_email,
      'role', actual_app_role,
      'role_title', role_title_to_store,
      'department', invitation_department,
      'specialization', invitation_specialization,
      'invited_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User invitation created successfully',
    'invitation_id', invitation_id,
    'invitation_token', invitation_token
  );
END;
$$;

-- Fix get_user_management_data function
CREATE OR REPLACE FUNCTION public.get_user_management_data(caller_id uuid)
RETURNS TABLE(id uuid, first_name text, last_name text, role text, assigned_role_title text, approval_status text, approved_by uuid, approved_at timestamp with time zone, rejection_reason text, created_at timestamp with time zone, updated_at timestamp with time zone, email text, confirmed_at timestamp with time zone, last_sign_in_at timestamp with time zone, has_profile boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = caller_id 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        au.id,
        COALESCE(p.first_name, '') as first_name,
        COALESCE(p.last_name, '') as last_name,
        COALESCE(ur.role::text, '') as role,
        COALESCE(p.assigned_role_title, ur.role::text, '') as assigned_role_title,
        COALESCE(p.approval_status, 'pending') as approval_status,
        p.approved_by,
        p.approved_at,
        p.rejection_reason,
        au.created_at,
        au.updated_at,
        COALESCE(au.email, '') as email,
        au.confirmed_at,
        au.last_sign_in_at,
        (p.id IS NOT NULL) as has_profile
    FROM 
        auth.users au
    LEFT JOIN 
        public.profiles p ON au.id = p.id
    LEFT JOIN
        public.user_roles ur ON au.id = ur.user_id
    WHERE 
        au.aud = 'authenticated'
    ORDER BY 
        au.created_at DESC;
END;
$$;

-- Fix admin_cascade_delete_user_data (overloaded version) function
CREATE OR REPLACE FUNCTION public.admin_cascade_delete_user_data(target_user_id uuid, calling_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_profile RECORD;
  cleanup_summary jsonb := '[]'::jsonb;
  deleted_count integer;
  table_name text;
BEGIN
  SELECT * INTO caller_profile
  FROM public.user_roles
  WHERE user_id = calling_user_id AND role = 'admin';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only administrators can delete user data');
  END IF;
  
  IF target_user_id = calling_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot delete your own account');
  END IF;
  
  DELETE FROM public.audit_logs WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('audit_logs', deleted_count);
  
  DELETE FROM public.user_invitations WHERE invited_by = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('user_invitations', deleted_count);
  
  DELETE FROM public.maintenance_requests WHERE created_by = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('maintenance_requests', deleted_count);
  
  DELETE FROM public.cafeteria_orders WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('cafeteria_orders', deleted_count);
  
  DELETE FROM public.vendor_staff WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('vendor_staff', deleted_count);
  
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('notifications', deleted_count);
  
  DELETE FROM public.profiles WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  cleanup_summary := cleanup_summary || jsonb_build_object('profiles', deleted_count);
  
  RETURN jsonb_build_object(
    'success', true, 
    'cleanup_summary', cleanup_summary,
    'message', 'User data successfully cleaned up'
  );
END;
$$;