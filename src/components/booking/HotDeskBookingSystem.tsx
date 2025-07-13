import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Monitor, MapPin, Users, Clock, Wifi, CheckCircle, XCircle, Calendar as CalendarIcon } from "lucide-react";
import { format, isSameDay, isAfter, isBefore } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface HotDesk {
  id: string;
  desk_number: string;
  zone: string;
  floor: string;
  location_description: string | null;
  equipment_available: string[] | null;
  amenities: string[] | null;
  is_available: boolean;
  is_accessible: boolean;
  max_booking_duration_hours: number;
  photo_url: string | null;
}

interface HotDeskBooking {
  id: string;
  desk_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  hot_desks: HotDesk;
}

export function HotDeskBookingSystem() {
  const [hotDesks, setHotDesks] = useState<HotDesk[]>([]);
  const [bookings, setBookings] = useState<HotDeskBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDesk, setSelectedDesk] = useState<HotDesk | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingForm, setBookingForm] = useState({
    start_time: "",
    end_time: "",
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchHotDesks();
    fetchBookings();
  }, [selectedDate]);

  const fetchHotDesks = async () => {
    try {
      const { data, error } = await supabase
        .from("hot_desks")
        .select("*")
        .eq("is_available", true)
        .order("desk_number");

      if (error) throw error;
      setHotDesks(data || []);
    } catch (error) {
      console.error("Error fetching hot desks:", error);
      toast({
        title: "Error",
        description: "Failed to load hot desks",
        variant: "destructive",
      });
    }
  };

  const fetchBookings = async () => {
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("hot_desk_bookings")
        .select(`
          *,
          hot_desks (*)
        `)
        .eq("booking_date", dateStr)
        .in("status", ["confirmed", "checked_in"]);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const isTimeSlotAvailable = (desk: HotDesk, startTime: string, endTime: string): boolean => {
    const deskBookings = bookings.filter(b => b.desk_id === desk.id);
    
    for (const booking of deskBookings) {
      if (
        (startTime >= booking.start_time && startTime < booking.end_time) ||
        (endTime > booking.start_time && endTime <= booking.end_time) ||
        (startTime <= booking.start_time && endTime >= booking.end_time)
      ) {
        return false;
      }
    }
    return true;
  };

  const createBooking = async () => {
    if (!selectedDesk || !bookingForm.start_time || !bookingForm.end_time) {
      toast({
        title: "Invalid booking",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isTimeSlotAvailable(selectedDesk, bookingForm.start_time, bookingForm.end_time)) {
      toast({
        title: "Time slot unavailable",
        description: "This desk is already booked for the selected time",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("hot_desk_bookings")
        .insert({
          desk_id: selectedDesk.id,
          user_id: user.user.id,
          booking_date: format(selectedDate, "yyyy-MM-dd"),
          start_time: bookingForm.start_time,
          end_time: bookingForm.end_time,
          notes: bookingForm.notes,
        });

      if (error) throw error;

      toast({
        title: "Booking confirmed",
        description: `Desk ${selectedDesk.desk_number} booked successfully`,
      });

      setSelectedDesk(null);
      setBookingForm({ start_time: "", end_time: "", notes: "" });
      fetchBookings();
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Booking failed",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDeskAvailabilityStatus = (desk: HotDesk): { status: string; nextAvailable?: string } => {
    const now = new Date();
    const currentTime = format(now, "HH:mm");
    const isToday = isSameDay(selectedDate, now);

    if (!isToday) {
      return { status: "available" };
    }

    const currentBooking = bookings.find(
      b => b.desk_id === desk.id && 
      currentTime >= b.start_time && 
      currentTime <= b.end_time
    );

    if (currentBooking) {
      return { 
        status: "occupied", 
        nextAvailable: bookings
          .filter(b => b.desk_id === desk.id && b.start_time > currentTime)
          .sort((a, b) => a.start_time.localeCompare(b.start_time))[0]?.end_time 
      };
    }

    const nextBooking = bookings
      .filter(b => b.desk_id === desk.id && b.start_time > currentTime)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))[0];

    return { 
      status: "available", 
      nextAvailable: nextBooking?.start_time 
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge className="bg-green-500 text-white">Available</Badge>;
      case "occupied":
        return <Badge className="bg-red-500 text-white">Occupied</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Hot Desk Booking</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {format(selectedDate, "PPP")}
            </span>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            disabled={(date) => isBefore(date, new Date())}
            className="rounded-md border"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hotDesks.map((desk) => {
          const availability = getDeskAvailabilityStatus(desk);
          return (
            <Card key={desk.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{desk.desk_number}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {desk.zone} • {desk.floor}
                    </div>
                  </div>
                  {getStatusBadge(availability.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {desk.location_description && (
                  <p className="text-sm text-muted-foreground">
                    {desk.location_description}
                  </p>
                )}

                {desk.equipment_available && desk.equipment_available.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-1">Equipment</h5>
                    <div className="flex flex-wrap gap-1">
                      {desk.equipment_available.slice(0, 3).map((equipment, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {equipment}
                        </Badge>
                      ))}
                      {desk.equipment_available.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{desk.equipment_available.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {desk.amenities && desk.amenities.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-1">Amenities</h5>
                    <div className="flex flex-wrap gap-1">
                      {desk.amenities.slice(0, 2).map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {availability.nextAvailable && (
                  <div className="text-sm text-muted-foreground">
                    {availability.status === "occupied" 
                      ? `Available from ${availability.nextAvailable}`
                      : `Next booking at ${availability.nextAvailable}`
                    }
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {desk.is_accessible && (
                    <Badge variant="outline" className="text-xs">
                      ♿ Accessible
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Max {desk.max_booking_duration_hours}h
                  </span>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full" 
                      disabled={availability.status === "occupied"}
                      onClick={() => setSelectedDesk(desk)}
                    >
                      {availability.status === "occupied" ? "Occupied" : "Book Desk"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Book {desk.desk_number}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="start-time">Start Time</Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={bookingForm.start_time}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, start_time: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end-time">End Time</Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={bookingForm.end_time}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, end_time: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special requirements or notes..."
                          value={bookingForm.notes}
                          onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setSelectedDesk(null)}>
                          Cancel
                        </Button>
                        <Button onClick={createBooking}>
                          Confirm Booking
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hotDesks.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Monitor className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No hot desks available</h3>
            <p className="text-muted-foreground">
              Hot desk booking system is being set up. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}