
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import RoomsList from '@/components/rooms/RoomsList';
import BookingTemplatesManager from '@/components/rooms/BookingTemplatesManager';
import RecurringBookingsView from '@/components/rooms/RecurringBookingsView';

const BookingsPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleBookRoom = async (roomId: string, timeSlot: string) => {
    if (!user) return;

    const startTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${timeSlot}:00`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour booking

    try {
      const { error } = await supabase
        .from('room_bookings')
        .insert({
          room_id: roomId,
          user_id: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          title: 'Meeting',
          status: 'confirmed'
        });

      if (error) throw error;

      toast({
        title: "Room Booked",
        description: `Successfully booked for ${timeSlot} on ${selectedDate.toLocaleDateString()}`,
      });
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="px-4 py-6">
      <h2 className="text-2xl font-bold text-white mb-6">Conference Room Booking</h2>
      
      <Tabs defaultValue="booking" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="booking">Book a Room</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Meetings</TabsTrigger>
          <TabsTrigger value="templates">Manage Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="booking" className="space-y-6">
          <div className="mb-8">
            <h3 className="text-lg font-medium text-white mb-3">Select Date</h3>
            <div className="bg-card rounded-lg p-4 card-shadow">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="bg-card pointer-events-auto"
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-white">Available Rooms</h3>
              <div className="text-sm text-gray-400">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            <RoomsList 
              selectedDate={selectedDate}
              selectedRoom={selectedRoom}
              onSelectRoom={setSelectedRoom}
              onBookRoom={handleBookRoom}
            />
          </div>
        </TabsContent>

        <TabsContent value="recurring">
          <RecurringBookingsView />
        </TabsContent>

        <TabsContent value="templates">
          <BookingTemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BookingsPage;
