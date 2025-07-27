import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Clock,
  Users,
  Wifi,
  Monitor,
  Coffee,
  Camera,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface TenantRoomBookingProps {
  tenantId: string;
}

const TenantRoomBooking: React.FC<TenantRoomBookingProps> = ({ tenantId }) => {
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [attendees, setAttendees] = useState('');

  const queryClient = useQueryClient();

  // Get available rooms
  const { data: rooms, isLoading: loadingRooms } = useQuery({
    queryKey: ['available-rooms', bookingDate, startTime, endTime],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_rooms')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      // Filter out rooms that are already booked
      if (bookingDate && startTime && endTime) {
        const startDateTime = `${bookingDate}T${startTime}:00`;
        const endDateTime = `${bookingDate}T${endTime}:00`;

        const { data: bookings } = await supabase
          .from('meeting_room_bookings')
          .select('room_id')
          .eq('status', 'confirmed')
          .or(`and(start_time.lte.${startDateTime},end_time.gt.${startDateTime}),and(start_time.lt.${endDateTime},end_time.gte.${endDateTime}),and(start_time.gte.${startDateTime},end_time.lte.${endDateTime})`);

        const bookedRoomIds = bookings?.map(b => b.room_id) || [];
        return data?.filter(room => !bookedRoomIds.includes(room.id)) || [];
      }

      return data || [];
    },
    enabled: !!bookingDate
  });

  // Get my bookings
  const { data: myBookings } = useQuery({
    queryKey: ['my-bookings', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_room_bookings')
        .select(`
          *,
          room:meeting_rooms(name, floor, capacity)
        `)
        .eq('tenant_id', tenantId)
        .gte('start_time', new Date().toISOString())
        .order('start_time');

      if (error) throw error;
      return data;
    }
  });

  // Book room mutation
  const bookRoomMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const { data, error } = await supabase
        .from('meeting_room_bookings')
        .insert([{
          room_id: bookingData.roomId,
          tenant_id: tenantId,
          start_time: `${bookingDate}T${startTime}:00`,
          end_time: `${bookingDate}T${endTime}:00`,
          purpose: purpose || 'Meeting',
          attendees_count: parseInt(attendees) || 1,
          status: 'confirmed',
          booking_type: 'tenant'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Room booked successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-rooms'] });
      setSelectedRoom(null);
      setStartTime('');
      setEndTime('');
      setPurpose('');
      setAttendees('');
    },
    onError: () => {
      toast.error('Failed to book room. Please try again.');
    }
  });

  const getRoomAmenities = (room: any) => {
    const amenities = [];
    if (room.has_projector) amenities.push({ icon: Monitor, label: 'Projector' });
    if (room.has_whiteboard) amenities.push({ icon: Users, label: 'Whiteboard' });
    if (room.has_video_conf) amenities.push({ icon: Camera, label: 'Video Conference' });
    if (room.has_wifi) amenities.push({ icon: Wifi, label: 'WiFi' });
    return amenities;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-700';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700';
      case 'cancelled': return 'bg-red-500/10 text-red-700';
      default: return 'bg-gray-500/10 text-gray-700';
    }
  };

  const handleBookRoom = () => {
    if (!selectedRoom || !startTime || !endTime) {
      toast.error('Please select room and time slots');
      return;
    }

    bookRoomMutation.mutate({ roomId: selectedRoom.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Booking</h1>
          <p className="text-muted-foreground">
            Book meeting rooms and workspaces
          </p>
        </div>
        <Calendar className="h-8 w-8 text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Book a Room</CardTitle>
            <CardDescription>
              Select date, time, and room for your meeting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div>
                <Label htmlFor="attendees">Attendees</Label>
                <Input
                  id="attendees"
                  type="number"
                  placeholder="Number of people"
                  value={attendees}
                  onChange={(e) => setAttendees(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="purpose">Purpose (Optional)</Label>
              <Textarea
                id="purpose"
                placeholder="Meeting purpose or agenda"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
              />
            </div>

            {selectedRoom && (
              <div className="p-4 border rounded-lg bg-accent/10">
                <h4 className="font-medium mb-2">Selected Room</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedRoom.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Floor {selectedRoom.floor} • Capacity: {selectedRoom.capacity}
                    </p>
                  </div>
                  <Button onClick={handleBookRoom} disabled={bookRoomMutation.isPending}>
                    {bookRoomMutation.isPending ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Rooms */}
        <Card>
          <CardHeader>
            <CardTitle>Available Rooms</CardTitle>
            <CardDescription>
              {bookingDate && startTime && endTime 
                ? `Available for ${format(new Date(bookingDate), 'MMM dd')} from ${startTime} to ${endTime}`
                : 'Select date and time to see availability'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingRooms ? (
              <div className="text-center py-8">Loading rooms...</div>
            ) : rooms?.length ? (
              <div className="space-y-3">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRoom?.id === room.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedRoom(room)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{room.name}</h4>
                      <Badge variant="outline">
                        <Users className="h-3 w-3 mr-1" />
                        {room.capacity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Floor {room.floor} • {room.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getRoomAmenities(room).map((amenity, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <amenity.icon className="h-3 w-3" />
                          {amenity.label}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {bookingDate && startTime && endTime 
                  ? 'No rooms available for selected time'
                  : 'Select date and time to check availability'
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>My Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {myBookings?.length ? (
            <div className="space-y-3">
              {myBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium">{booking.room?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.start_time), 'MMM dd, yyyy')} • 
                        {format(new Date(booking.start_time), 'HH:mm')} - 
                        {format(new Date(booking.end_time), 'HH:mm')}
                      </p>
                      {booking.purpose && (
                        <p className="text-sm text-muted-foreground">{booking.purpose}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status === 'confirmed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {booking.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                      {booking.status === 'cancelled' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No upcoming bookings
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantRoomBooking;