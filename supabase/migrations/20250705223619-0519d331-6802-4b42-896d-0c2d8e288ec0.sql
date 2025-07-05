-- Enable realtime for key tables
ALTER TABLE maintenance_requests REPLICA IDENTITY FULL;
ALTER TABLE service_bookings REPLICA IDENTITY FULL;
ALTER TABLE visitors REPLICA IDENTITY FULL;
ALTER TABLE request_comments REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE maintenance_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE service_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE visitors;
ALTER PUBLICATION supabase_realtime ADD TABLE request_comments;

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'info',
  action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, action_url)
  VALUES (target_user_id, notification_title, notification_message, notification_type, action_url)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;