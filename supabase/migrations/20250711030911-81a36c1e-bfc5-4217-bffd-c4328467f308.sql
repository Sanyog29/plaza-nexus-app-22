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
  recurring_date DATE;
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
  recurring_date := (base_booking.start_time::DATE) + interval_days;
  
  WHILE recurring_date <= end_date LOOP
    new_start_time := recurring_date + (base_booking.start_time::TIME);
    new_end_time := recurring_date + (base_booking.end_time::TIME);
    
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
    
    recurring_date := recurring_date + interval_days;
  END LOOP;
  
  RETURN created_count;
END;
$$;