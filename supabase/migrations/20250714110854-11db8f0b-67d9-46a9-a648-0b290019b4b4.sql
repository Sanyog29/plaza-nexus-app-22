-- Create comprehensive notification system
-- First, create an enhanced notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'system', 'alert', 'maintenance', 'security', 'info', 'warning', 'error'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  is_read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to automatically create notifications from alerts
CREATE OR REPLACE FUNCTION public.create_alert_notifications()
RETURNS TRIGGER AS $$
DECLARE
  target_users RECORD;
  notification_title TEXT;
  notification_message TEXT;
  notification_priority TEXT;
BEGIN
  -- Only process active alerts
  IF NEW.is_active = true THEN
    -- Determine notification priority based on alert severity
    notification_priority := CASE NEW.severity
      WHEN 'critical' THEN 'urgent'
      WHEN 'high' THEN 'high'
      WHEN 'medium' THEN 'normal'
      ELSE 'low'
    END;
    
    -- Create notification title and message
    notification_title := 'System Alert: ' || NEW.title;
    notification_message := NEW.message;
    
    -- Send notifications to admin and operations staff
    FOR target_users IN 
      SELECT id FROM public.profiles 
      WHERE role IN ('admin', 'ops_supervisor', 'field_staff')
    LOOP
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        priority,
        action_url,
        metadata
      ) VALUES (
        target_users.id,
        notification_title,
        notification_message,
        'alert',
        notification_priority,
        '/alerts',
        jsonb_build_object(
          'alert_id', NEW.id,
          'severity', NEW.severity,
          'alert_type', 'system_alert'
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for alert notifications
DROP TRIGGER IF EXISTS alert_notification_trigger ON public.alerts;
CREATE TRIGGER alert_notification_trigger
  AFTER INSERT OR UPDATE ON public.alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_alert_notifications();

-- Create function to create maintenance request notifications
CREATE OR REPLACE FUNCTION public.create_maintenance_notifications()
RETURNS TRIGGER AS $$
DECLARE
  assignee_id UUID;
  reporter_id UUID;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get the assigned user and reporter
  assignee_id := NEW.assigned_to;
  reporter_id := NEW.reported_by;
  
  -- Create different notifications based on status changes
  IF TG_OP = 'INSERT' THEN
    -- New request created
    notification_title := 'New Maintenance Request';
    notification_message := 'Request "' || NEW.title || '" has been created for ' || NEW.location;
    
    -- Notify assigned staff member
    IF assignee_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, title, message, type, priority, action_url, metadata
      ) VALUES (
        assignee_id, notification_title, notification_message, 'maintenance', 
        CASE NEW.priority WHEN 'urgent' THEN 'urgent' WHEN 'high' THEN 'high' ELSE 'normal' END,
        '/admin/requests/' || NEW.id,
        jsonb_build_object('request_id', NEW.id, 'status', NEW.status)
      );
    END IF;
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Status changed
    notification_title := 'Maintenance Request Updated';
    notification_message := 'Request "' || NEW.title || '" status changed to ' || NEW.status;
    
    -- Notify reporter if status changed to completed
    IF NEW.status = 'completed' AND reporter_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, title, message, type, priority, action_url, metadata
      ) VALUES (
        reporter_id, 'Request Completed', 
        'Your maintenance request "' || NEW.title || '" has been completed.',
        'maintenance', 'normal', '/requests/' || NEW.id,
        jsonb_build_object('request_id', NEW.id, 'status', 'completed')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for maintenance notifications
DROP TRIGGER IF EXISTS maintenance_notification_trigger ON public.maintenance_requests;
CREATE TRIGGER maintenance_notification_trigger
  AFTER INSERT OR UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.create_maintenance_notifications();

-- Create function to clean up old notifications
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM public.notifications 
  WHERE is_read = true 
    AND read_at < NOW() - INTERVAL '30 days';
    
  -- Delete expired notifications
  DELETE FROM public.notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
  -- Delete unread notifications older than 90 days (except urgent ones)
  DELETE FROM public.notifications 
  WHERE is_read = false 
    AND priority != 'urgent'
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Add function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS boolean AS $$
BEGIN
  UPDATE public.notifications 
  SET is_read = true, read_at = NOW()
  WHERE id = notification_id AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS boolean AS $$
BEGIN
  UPDATE public.notifications 
  SET is_read = true, read_at = NOW()
  WHERE user_id = auth.uid() AND is_read = false;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;