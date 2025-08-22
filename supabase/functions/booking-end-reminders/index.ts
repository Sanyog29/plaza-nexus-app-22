import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BookingRecord {
  id: string;
  user_id: string;
  title: string;
  end_time: string;
  room_id: string;
  room_name: string;
}

interface UserProfile {
  first_name: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting booking end reminders check...');

    // Find bookings that will end in approximately 10 minutes
    const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const elevenMinutesFromNow = new Date(Date.now() + 11 * 60 * 1000).toISOString();
    const nineMinutesFromNow = new Date(Date.now() + 9 * 60 * 1000).toISOString();

    const { data: bookings, error: bookingsError } = await supabase
      .from('room_bookings')
      .select(`
        id,
        user_id,
        title,
        end_time,
        room_id,
        rooms!inner(name)
      `)
      .eq('status', 'confirmed')
      .gt('end_time', new Date().toISOString())
      .lte('end_time', elevenMinutesFromNow)
      .gte('end_time', nineMinutesFromNow);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      throw bookingsError;
    }

    console.log(`Found ${bookings?.length || 0} bookings ending in ~10 minutes`);

    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No bookings ending soon', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let remindersCreated = 0;

    for (const booking of bookings) {
      const bookingRecord = {
        id: booking.id,
        user_id: booking.user_id,
        title: booking.title,
        end_time: booking.end_time,
        room_id: booking.room_id,
        room_name: (booking.rooms as any).name
      } as BookingRecord;

      // Check if we've already sent a reminder for this booking in the last 15 minutes
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', bookingRecord.user_id)
        .eq('type', 'booking_reminder')
        .contains('metadata', { booking_id: bookingRecord.id })
        .gt('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

      if (existingNotifications && existingNotifications.length > 0) {
        console.log(`Reminder already sent for booking ${bookingRecord.id}`);
        continue;
      }

      // Get user's first name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name')
        .eq('id', bookingRecord.user_id)
        .single();

      const userName = (profile as UserProfile)?.first_name || 'there';

      // Create personalized reminder message
      const reminderMessage = `Hey ${userName}, you're 10 minutes away from wrapping up—make the best out of your time before the room moves on to the next guest. Make The Most out of it !!!`;

      // Insert notification
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: bookingRecord.user_id,
          title: `10 Minutes Left in ${bookingRecord.room_name}`,
          message: reminderMessage,
          type: 'booking_reminder',
          priority: 'high',
          action_url: '/bookings',
          metadata: {
            booking_id: bookingRecord.id,
            room_name: bookingRecord.room_name,
            end_time: bookingRecord.end_time
          }
        });

      if (notificationError) {
        console.error(`Error creating notification for booking ${bookingRecord.id}:`, notificationError);
      } else {
        console.log(`Created reminder for booking ${bookingRecord.id} - ${bookingRecord.room_name}`);
        remindersCreated++;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Created ${remindersCreated} booking reminders`,
        count: remindersCreated,
        bookings_checked: bookings.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in booking-end-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});