-- Fix search path security issues for new functions
CREATE OR REPLACE FUNCTION public.award_completion_points()
RETURNS TRIGGER AS $$
DECLARE
  base_points integer := 10;
  priority_multiplier numeric := 1.0;
  speed_bonus integer := 0;
  quality_bonus integer := 0;
  total_points integer;
  completion_hours numeric;
  expected_hours numeric;
BEGIN
  -- Only award points when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate completion time in hours
    completion_hours := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.created_at))/3600;
    
    -- Set expected hours based on priority
    expected_hours := CASE NEW.priority
      WHEN 'urgent' THEN 2
      WHEN 'high' THEN 8
      WHEN 'medium' THEN 24
      WHEN 'low' THEN 72
      ELSE 24
    END;
    
    -- Priority multipliers
    priority_multiplier := CASE NEW.priority
      WHEN 'urgent' THEN 3.0
      WHEN 'high' THEN 2.0
      WHEN 'medium' THEN 1.5
      WHEN 'low' THEN 1.0
      ELSE 1.0
    END;
    
    -- Speed bonus for completing within expected time
    IF completion_hours <= expected_hours THEN
      speed_bonus := ROUND(base_points * 0.5);
    END IF;
    
    -- Quality bonus (check if before/after photos are uploaded)
    SELECT CASE 
      WHEN before_photos_uploaded AND after_photos_uploaded THEN ROUND(base_points * 0.3)
      ELSE 0
    END INTO quality_bonus
    FROM public.request_workflow_states 
    WHERE request_id = NEW.id;
    
    -- Calculate total points
    total_points := ROUND(base_points * priority_multiplier) + speed_bonus + COALESCE(quality_bonus, 0);
    
    -- Award points if technician is assigned
    IF NEW.assigned_to IS NOT NULL THEN
      -- Insert point transaction
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
      
      -- Update technician points balance
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_workflow_state()
RETURNS TRIGGER AS $$
BEGIN
  -- Create or update workflow state when request is assigned
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    INSERT INTO public.request_workflow_states (request_id, technician_id, current_stage)
    VALUES (NEW.id, NEW.assigned_to, 'assigned')
    ON CONFLICT (request_id) DO UPDATE SET
      technician_id = NEW.assigned_to,
      current_stage = 'assigned',
      updated_at = now();
  END IF;
  
  -- Update stage when status changes
  IF NEW.status != COALESCE(OLD.status, 'pending') THEN
    UPDATE public.request_workflow_states
    SET current_stage = CASE 
      WHEN NEW.status = 'in_progress' THEN 'in_progress'
      WHEN NEW.status = 'completed' THEN 'completed'
      ELSE current_stage
    END,
    started_at = CASE WHEN NEW.status = 'in_progress' AND started_at IS NULL THEN now() ELSE started_at END,
    completed_at = CASE WHEN NEW.status = 'completed' THEN now() ELSE completed_at END,
    updated_at = now()
    WHERE request_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_photo_upload_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update workflow state when before/after photos are uploaded
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;