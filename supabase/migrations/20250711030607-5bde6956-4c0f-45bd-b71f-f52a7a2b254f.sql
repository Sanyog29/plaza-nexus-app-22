-- Add support for enhanced booking management features

-- Add new columns to room_bookings for enhanced features
ALTER TABLE room_bookings 
ADD COLUMN duration_minutes INTEGER DEFAULT 60,
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence_rule JSONB DEFAULT NULL,
ADD COLUMN parent_booking_id UUID REFERENCES room_bookings(id) ON DELETE CASCADE,
ADD COLUMN template_id UUID DEFAULT NULL,
ADD COLUMN buffer_time_minutes INTEGER DEFAULT 0,
ADD COLUMN meeting_agenda TEXT DEFAULT NULL,
ADD COLUMN attendee_count INTEGER DEFAULT NULL,
ADD COLUMN equipment_needed JSONB DEFAULT NULL;

-- Create booking templates table
CREATE TABLE booking_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  room_type_preference TEXT,
  capacity_needed INTEGER,
  equipment_needed JSONB DEFAULT NULL,
  buffer_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on booking templates
ALTER TABLE booking_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for booking templates
CREATE POLICY "Users can manage their own templates" 
ON booking_templates 
FOR ALL 
USING (auth.uid() = user_id);

-- Create index for booking templates
CREATE INDEX idx_booking_templates_user_id ON booking_templates(user_id);

-- Add indexes for new room_bookings columns
CREATE INDEX idx_room_bookings_template_id ON room_bookings(template_id);
CREATE INDEX idx_room_bookings_parent_booking ON room_bookings(parent_booking_id);
CREATE INDEX idx_room_bookings_recurrence ON room_bookings(is_recurring) WHERE is_recurring = true;

-- Function to generate recurring bookings
CREATE OR REPLACE FUNCTION generate_recurring_bookings(
  base_booking_id UUID,
  recurrence_rule JSONB,
  end_date DATE
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_booking RECORD;
  current_date DATE;
  new_start_time TIMESTAMP WITH TIME ZONE;
  new_end_time TIMESTAMP WITH TIME ZONE;
  interval_days INTEGER;
  created_count INTEGER := 0;
BEGIN
  -- Get the base booking details
  SELECT * INTO base_booking 
  FROM room_bookings 
  WHERE id = base_booking_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Base booking not found';
  END IF;
  
  -- Extract interval from recurrence rule
  interval_days := CASE 
    WHEN recurrence_rule->>'frequency' = 'daily' THEN 1
    WHEN recurrence_rule->>'frequency' = 'weekly' THEN 7
    WHEN recurrence_rule->>'frequency' = 'monthly' THEN 30
    ELSE 7
  END;
  
  -- Generate recurring bookings
  current_date := (base_booking.start_time::DATE) + interval_days;
  
  WHILE current_date <= end_date LOOP
    new_start_time := current_date + (base_booking.start_time::TIME);
    new_end_time := current_date + (base_booking.end_time::TIME);
    
    -- Check if room is available
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
      -- Create the recurring booking
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
    
    current_date := current_date + interval_days;
  END LOOP;
  
  RETURN created_count;
END;
$$;

-- Function to check room availability with buffer time
CREATE OR REPLACE FUNCTION check_room_availability_with_buffer(
  room_id_param UUID,
  start_time_param TIMESTAMP WITH TIME ZONE,
  end_time_param TIMESTAMP WITH TIME ZONE,
  buffer_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM room_bookings 
    WHERE room_id = room_id_param 
    AND status = 'confirmed'
    AND (
      (start_time_param - INTERVAL '1 minute' * buffer_minutes >= start_time AND 
       start_time_param - INTERVAL '1 minute' * buffer_minutes < end_time + INTERVAL '1 minute' * buffer_time_minutes) OR
      (end_time_param + INTERVAL '1 minute' * buffer_minutes > start_time - INTERVAL '1 minute' * buffer_time_minutes AND 
       end_time_param + INTERVAL '1 minute' * buffer_minutes <= end_time) OR
      (start_time_param - INTERVAL '1 minute' * buffer_minutes <= start_time AND 
       end_time_param + INTERVAL '1 minute' * buffer_minutes >= end_time + INTERVAL '1 minute' * buffer_time_minutes)
    )
  );
END;
$$;