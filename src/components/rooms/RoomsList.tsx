import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, MapPin, Monitor } from 'lucide-react';
import EnhancedBookingDialog from './EnhancedBookingDialog';

interface RoomsListProps {
  selectedDate: Date;
  selectedRoom: string | null;
  onSelectRoom: (roomId: string) => void;
  onBookRoom: (roomId: string, timeSlot: string) => void;
}

const RoomsList: React.FC<RoomsListProps> = ({ 
  selectedDate, 
  selectedRoom, 
  onSelectRoom,
  onBookRoom 
}) => {
  const [bookingDialog, setBookingDialog] = useState<{
    isOpen: boolean;
    roomId: string;
    roomName: string;
    timeSlot: string;
  }>({
    isOpen: false,
    roomId: '',
    roomName: '',
    timeSlot: ''
  });
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, location, capacity, facilities, image_url')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['room-bookings', selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const { data, error } = await supabase
        .rpc('get_room_availability_data', { target_date: dateStr });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedDate,
    staleTime: 30 * 1000, // 30 seconds
  });

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Memoize availability calculation for performance
  const roomAvailability = React.useMemo(() => {
    const availability: Record<string, Record<string, boolean>> = {};
    const timeSlots = getTimeSlots();
    
    rooms.forEach(room => {
      availability[room.id] = {};
      timeSlots.forEach(slot => {
        const slotDateTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${slot}:00`);
        availability[room.id][slot] = !bookings.some(booking => {
          const startTime = new Date(booking.start_time);
          const endTime = new Date(booking.end_time);
          return booking.room_id === room.id && 
                 slotDateTime >= startTime && 
                 slotDateTime < endTime;
        });
      });
    });
    
    return availability;
  }, [rooms, bookings, selectedDate]);

  const isSlotAvailable = (roomId: string, timeSlot: string) => {
    return roomAvailability[roomId]?.[timeSlot] ?? false;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {rooms.map((room) => (
        <div 
          key={room.id}
          className={`bg-card rounded-lg p-4 card-shadow cursor-pointer transition-colors ${
            selectedRoom === room.id ? 'border-2 border-plaza-blue' : 'hover:bg-card/80'
          }`}
          onClick={() => onSelectRoom(room.id)}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-medium text-white">{room.name}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{room.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>Capacity: {room.capacity}</span>
                </div>
              </div>
              {room.facilities && room.facilities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {room.facilities.map((facility: string) => (
                    <span 
                      key={facility}
                      className="text-xs px-2 py-1 rounded-full bg-muted text-gray-300 flex items-center gap-1"
                    >
                      {facility.includes('Projector') && <Monitor size={12} />}
                      {facility}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-300 mb-2">Availability</h5>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {getTimeSlots().map((slot) => {
                const available = isSlotAvailable(room.id, slot);
                return (
                  <Button
                    key={slot}
                    variant="outline"
                    size="sm"
                    disabled={!available}
                    className={available 
                      ? 'bg-muted hover:bg-plaza-blue hover:text-white' 
                      : 'bg-red-900/20 text-red-400 opacity-50 cursor-not-allowed'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (available) {
                        setBookingDialog({
                          isOpen: true,
                          roomId: room.id,
                          roomName: room.name,
                          timeSlot: slot
                        });
                      }
                    }}
                  >
                    {slot}
                  </Button>
                );
              })}
            </div>
          </div>
          </div>
        ))}
      </div>

      <EnhancedBookingDialog
        isOpen={bookingDialog.isOpen}
        onClose={() => setBookingDialog(prev => ({ ...prev, isOpen: false }))}
        roomId={bookingDialog.roomId}
        roomName={bookingDialog.roomName}
        selectedDate={selectedDate}
        selectedTime={bookingDialog.timeSlot}
      />
    </>
  );
};

export default RoomsList;