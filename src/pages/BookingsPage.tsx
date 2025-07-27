import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotDeskBookingSystem } from "@/components/booking/HotDeskBookingSystem";
import { useAuth } from "@/components/AuthProvider";
import { Calendar, Monitor, Users, Bookmark, Repeat } from "lucide-react";
import RoomsList from "@/components/rooms/RoomsList";
import BookingTemplatesManager from "@/components/rooms/BookingTemplatesManager";
import RecurringBookingsView from "@/components/rooms/RecurringBookingsView";
import { useState } from "react";

export default function BookingsPage() {
  const { userRole } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoom(roomId);
  };
  
  const handleBookRoom = (roomId: string, timeSlot: string) => {
    // This will be handled by the EnhancedBookingDialog in RoomsList
    console.log('Booking room:', roomId, 'at', timeSlot);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Bookings & Reservations</h1>
        </div>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="rooms" className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Meeting</span> Rooms
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1 text-sm">
              <Bookmark className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex items-center gap-1 text-sm">
              <Repeat className="h-4 w-4" />
              Recurring
            </TabsTrigger>
            <TabsTrigger value="hotdesks" className="flex items-center gap-1 text-sm">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Hot</span> Desks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="mt-6">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Select Date</label>
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
              
              <RoomsList
                selectedDate={selectedDate}
                selectedRoom={selectedRoom}
                onSelectRoom={handleSelectRoom}
                onBookRoom={handleBookRoom}
              />
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <BookingTemplatesManager />
          </TabsContent>

          <TabsContent value="recurring" className="mt-6">
            <RecurringBookingsView />
          </TabsContent>

          <TabsContent value="hotdesks" className="mt-6">
            <HotDeskBookingSystem />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}