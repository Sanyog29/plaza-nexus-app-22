import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotDeskBookingSystem } from "@/components/booking/HotDeskBookingSystem";
import { useAuth } from "@/components/AuthProvider";
import { Calendar, Monitor, Users } from "lucide-react";

export default function BookingsPage() {
  const { userRole } = useAuth();

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Bookings & Reservations</h1>
        </div>

        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Meeting Rooms
            </TabsTrigger>
            <TabsTrigger value="hotdesks" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Hot Desks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="mt-6">
            <div className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Meeting Room Booking</h3>
              <p className="text-muted-foreground">Meeting room booking system coming soon!</p>
            </div>
          </TabsContent>

          <TabsContent value="hotdesks" className="mt-6">
            <HotDeskBookingSystem />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}