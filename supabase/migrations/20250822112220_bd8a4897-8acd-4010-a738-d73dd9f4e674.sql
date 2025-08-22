-- Create a function to check for bookings ending in 10 minutes and send reminders
CREATE OR REPLACE FUNCTION send_booking_end_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    booking_record RECORD;
    user_name TEXT;
    reminder_message TEXT;
BEGIN
    -- Find bookings that will end in approximately 10 minutes (within 1 minute window)
    FOR booking_record IN 
        SELECT rb.id, rb.user_id, rb.title, rb.end_time, rb.room_id,
               r.name as room_name
        FROM room_bookings rb
        JOIN rooms r ON r.id = rb.room_id
        WHERE rb.status = 'confirmed'
        AND rb.end_time > NOW()
        AND rb.end_time <= NOW() + INTERVAL '11 minutes'
        AND rb.end_time >= NOW() + INTERVAL '9 minutes'
        -- Ensure we haven't already sent a reminder for this booking
        AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.user_id = rb.user_id 
            AND n.metadata->>'booking_id' = rb.id::text
            AND n.type = 'booking_reminder'
            AND n.created_at > NOW() - INTERVAL '15 minutes'
        )
    LOOP
        -- Get user's first name from profiles
        SELECT COALESCE(first_name, 'there') INTO user_name
        FROM profiles 
        WHERE id = booking_record.user_id;

        -- Create personalized reminder message
        reminder_message := 'Hey ' || user_name || ', you''re 10 minutes away from wrapping up—make the best out of your time before the room moves on to the next guest. Make The Most out of it !!!';

        -- Insert notification
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            priority,
            action_url,
            metadata
        ) VALUES (
            booking_record.user_id,
            '10 Minutes Left in ' || booking_record.room_name,
            reminder_message,
            'booking_reminder',
            'high',
            '/bookings',
            jsonb_build_object(
                'booking_id', booking_record.id,
                'room_name', booking_record.room_name,
                'end_time', booking_record.end_time
            )
        );
    END LOOP;
END;
$$;

-- Create a scheduled job to run the reminder function every minute
SELECT cron.schedule(
    'booking-end-reminders',
    '* * * * *', -- Every minute
    'SELECT send_booking_end_reminders();'
);