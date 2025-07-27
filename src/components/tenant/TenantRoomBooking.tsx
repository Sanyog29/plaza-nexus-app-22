import React, { useState } from 'react';
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
  Camera,
  CheckCircle,
  Construction
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

  // Mock data for demonstration
  const mockRooms = [
    {
      id: '1',
      name: 'Conference Room A',
      floor: 2,
      capacity: 10,
      description: 'Large conference room with video conferencing',
      has_projector: true,
      has_whiteboard: true,
      has_video_conf: true,
      has_wifi: true
    },
    {
      id: '2',  
      name: 'Meeting Room B',
      floor: 3,
      capacity: 6,
      description: 'Small meeting room for team discussions',
      has_projector: false,
      has_whiteboard: true,
      has_video_conf: false,
      has_wifi: true
    }
  ];

  const mockBookings = [
    {
      id: '1',
      room: { name: 'Conference Room A', floor: 2, capacity: 10 },
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      purpose: 'Team Meeting',
      status: 'confirmed'
    }
  ];

  const handleBookRoom = () => {
    if (!selectedRoom || !startTime || !endTime) {
      toast.error('Please select room and time slots');
      return;
    }
    
    toast.success('Room booking feature coming soon!');
    setSelectedRoom(null);
    setStartTime('');
    setEndTime('');
    setPurpose('');
    setAttendees('');
  };

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
                  <Button onClick={handleBookRoom}>
                    Book Room
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
            {bookingDate && startTime && endTime ? (
              <div className="space-y-3">
                {mockRooms.map((room) => (
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
                Select date and time to check availability
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
          {mockBookings.length ? (
            <div className="space-y-3">
              {mockBookings.map((booking) => (
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
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {booking.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Construction className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="font-medium mb-2">Room Booking System</h3>
              <p className="text-muted-foreground">
                Room booking functionality is under development.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantRoomBooking;