import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HotDeskBookingSystem } from "@/components/booking/HotDeskBookingSystem";
import { useAuth } from "@/components/AuthProvider";
import { Calendar, Monitor, Users, Bookmark, Repeat, Search, Filter, ChevronDown, Heart, ArrowLeft, AlertCircle } from "lucide-react";
import RoomsList from "@/components/rooms/RoomsList";
import BookingTemplatesManager from "@/components/rooms/BookingTemplatesManager";
import RecurringBookingsView from "@/components/rooms/RecurringBookingsView";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  description?: string;
  facilities?: string[];
  image_url?: string;
  created_at: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  type?: string;
  requiresApproval?: boolean;
}

export default function BookingsPage() {
  const { userRole } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [activeTab, setActiveTab] = useState('rooms');
  
  // Updated time slots with specific intervals and approval logic
  const getTimeSlots = (): TimeSlot[] => {
    const slots = [
      { time: '09:00 AM', available: true, type: 'STANDARD' },
      { time: '10:15 AM', available: true, type: 'PREMIUM', requiresApproval: isRecurring },
      { time: '11:30 AM', available: true, type: 'STANDARD', requiresApproval: isRecurring },
      { time: '12:00 PM', available: false, type: 'PREMIUM', requiresApproval: isRecurring },
      { time: '01:00 PM', available: true, type: 'STANDARD', requiresApproval: isRecurring },
      { time: '03:00 PM', available: true, type: 'PREMIUM', requiresApproval: isRecurring },
      { time: '05:00 PM', available: true, type: 'STANDARD' },
      { time: '06:00 PM', available: true, type: 'PREMIUM' },
    ];
    
    // For recurring meetings, only early morning (before 10:15) and evening (after 5PM) slots are auto-approved
    if (isRecurring) {
      return slots.map(slot => ({
        ...slot,
        requiresApproval: !(['09:00 AM', '05:00 PM', '06:00 PM'].includes(slot.time))
      }));
    }
    
    return slots;
  };

  // Get week dates for horizontal scroll
  const getWeekDates = () => {
    const dates = [];
    const startDate = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      // Mock data for the new booking interface design
      const mockRooms: Room[] = [
        {
          id: '1',
          name: 'Conference Room A',
          capacity: 8,
          location: 'Floor 1 - North Wing',
          description: 'Large conference room with presentation equipment',
          facilities: ['Projector', 'Whiteboard', 'Video Conferencing'],
          created_at: new Date().toISOString()
        },
        {
          id: '2', 
          name: 'Meeting Room B',
          capacity: 4,
          location: 'Floor 2 - East Wing',
          description: 'Small meeting room for team discussions',
          facilities: ['TV Screen', 'Coffee Machine'],
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Boardroom',
          capacity: 12,
          location: 'Floor 3 - Executive',
          description: 'Executive boardroom for important meetings',
          facilities: ['Premium Audio/Visual', 'Executive Seating', 'Catering Service'],
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Creative Studio',
          capacity: 6,
          location: 'Floor 2 - West Wing',
          description: 'Open space for brainstorming and creative sessions',
          facilities: ['Whiteboard Walls', 'Comfortable Seating', 'Natural Light'],
          created_at: new Date().toISOString()
        }
      ];
      
      setRooms(mockRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoom(roomId);
  };

  const handleBookRoom = (roomId: string, timeSlot: string) => {
    console.log('Booking room:', roomId, 'at', timeSlot);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Meeting Rooms</h1>
              <p className="text-sm text-muted-foreground">Book your workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Filter className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Date Selector */}
      <div className="px-4 py-3 bg-background border-b border-border">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {weekDates.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const dayNumber = date.getDate();
            const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 px-4 py-3 rounded-lg text-center min-w-[70px] transition-colors ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card hover:bg-muted text-foreground'
                }`}
              >
                <div className="text-xs font-medium">{dayName}</div>
                <div className="text-lg font-bold">{dayNumber}</div>
                <div className="text-xs">{monthName}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Booking Type & Recurring Toggle */}
      <div className="px-4 py-3 bg-background border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Standard • Meeting</span>
            <button className="text-sm text-primary font-medium">Change &gt;</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Recurring</span>
            <Switch 
              checked={isRecurring} 
              onCheckedChange={setIsRecurring}
            />
          </div>
        </div>
        
        {isRecurring && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Recurring Meeting Notice</p>
                <p className="text-orange-700">Daytime slots (10:15 AM - 4:30 PM) require floor supervisor approval. Early morning and evening slots are auto-approved.</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-sm whitespace-nowrap">
            <ChevronDown className="h-4 w-4" />
            Sort by
          </button>
          <button className="px-4 py-2 border border-border rounded-full text-sm whitespace-nowrap">
            2-6 people
          </button>
          <button className="px-4 py-2 border border-border rounded-full text-sm whitespace-nowrap">
            1-2 hours
          </button>
          <button className="px-4 py-2 border border-border rounded-full text-sm whitespace-nowrap">
            4+ hours
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Show tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <div className="px-4 border-b border-border">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="rooms" className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Meeting</span> Rooms
              </TabsTrigger>
              <TabsTrigger value="hotdesks" className="flex items-center gap-1 text-sm">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Hot</span> Desks
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-1 text-sm">
                <Bookmark className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="recurring" className="flex items-center gap-1 text-sm">
                <Repeat className="h-4 w-4" />
                Recurring
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="rooms" className="flex-1 overflow-y-auto mt-0">
            {/* Rooms List */}
            <div className="flex-1">
              {rooms.map((room) => {
                const timeSlots = getTimeSlots();
                return (
                  <div key={room.id} className="px-4 py-4 border-b border-border bg-background">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-medium text-foreground">{room.name}</h3>
                          <Heart className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Capacity: {room.capacity} • {room.location}
                        </p>
                        <p className="text-sm text-green-600 mt-1">Cancellation available</p>
                        {room.facilities && room.facilities.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {room.facilities.join(' • ')}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">Available</span>
                    </div>

                    {/* Time Slots */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {timeSlots.map((slot, index) => (
                        <div key={index} className="relative">
                          <button
                            disabled={!slot.available}
                            onClick={() => slot.available && handleBookRoom(room.id, slot.time)}
                            className={`w-full px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                              slot.available
                                ? slot.type === 'PREMIUM'
                                  ? 'border-green-500 bg-green-50 text-green-700 hover:bg-green-100'
                                  : 'border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100'
                                : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <div className="text-xs font-bold">{slot.time}</div>
                            <div className="text-xs">{slot.type}</div>
                            {slot.requiresApproval && (
                              <div className="text-xs text-orange-600">Approval Req.</div>
                            )}
                          </button>
                          {slot.requiresApproval && (
                            <Badge 
                              variant="secondary" 
                              className="absolute -top-1 -right-1 text-xs px-1 py-0 bg-orange-100 text-orange-700"
                            >
                              !
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="hotdesks" className="flex-1 overflow-y-auto mt-0">
            <HotDeskBookingSystem />
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-y-auto mt-0">
            <BookingTemplatesManager />
          </TabsContent>

          <TabsContent value="recurring" className="flex-1 overflow-y-auto mt-0">
            <RecurringBookingsView />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}