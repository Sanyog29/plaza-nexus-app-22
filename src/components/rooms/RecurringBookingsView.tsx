import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Repeat, Calendar, Clock, MapPin, Trash2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface RecurringBooking {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  recurrence_rule: any;
  room: {
    name: string;
    location: string;
  };
  attendee_count: number;
  meeting_agenda: string;
  equipment_needed: string[];
  created_at: string;
  child_bookings_count: number;
}

const RecurringBookingsView: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's recurring bookings
  const { data: recurringBookings = [], isLoading } = useQuery({
    queryKey: ['recurring-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('room_bookings')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          duration_minutes,
          recurrence_rule,
          attendee_count,
          meeting_agenda,
          equipment_needed,
          created_at,
          rooms!inner(name, location)
        `)
        .eq('user_id', user.id)
        .eq('is_recurring', true)
        .is('parent_booking_id', null)
        .order('start_time', { ascending: true });
      
      if (error) throw error;

      // Get count of child bookings for each recurring booking
      const bookingsWithCount = await Promise.all(
        (data || []).map(async (booking) => {
          const { count } = await supabase
            .from('room_bookings')
            .select('*', { count: 'exact', head: true })
            .eq('parent_booking_id', booking.id);

          return {
            ...booking,
            room: booking.rooms,
            child_bookings_count: count || 0
          };
        })
      );

      return bookingsWithCount;
    },
    enabled: !!user
  });

  // Delete recurring booking series mutation
  const deleteRecurringSeriesMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      // Delete all child bookings first
      const { error: childError } = await supabase
        .from('room_bookings')
        .delete()
        .eq('parent_booking_id', bookingId);

      if (childError) throw childError;

      // Delete the parent booking
      const { error: parentError } = await supabase
        .from('room_bookings')
        .delete()
        .eq('id', bookingId);

      if (parentError) throw parentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['room-bookings'] });
      toast({
        title: "Series Deleted",
        description: "Recurring booking series deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-blue-500/20 text-blue-400';
      case 'weekly': return 'bg-green-500/20 text-green-400';
      case 'monthly': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (isLoading) return <div>Loading recurring bookings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white">Recurring Bookings</h3>
        <p className="text-gray-400">Manage your recurring meeting series</p>
      </div>

      <div className="space-y-4">
        {recurringBookings.map((booking) => (
          <Card key={booking.id} className="bg-card">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Repeat className="h-5 w-5" />
                    {booking.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 mt-1">
                    {booking.description}
                  </CardDescription>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Recurring Series</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this entire recurring booking series? 
                        This will cancel all {booking.child_bookings_count + 1} bookings in the series.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteRecurringSeriesMutation.mutate(booking.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Series
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.room.name} - {booking.room.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{booking.duration_minutes} minutes</span>
                </div>
                {booking.attendee_count && (
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{booking.attendee_count} attendees</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge className={getFrequencyColor((booking.recurrence_rule as any)?.frequency || 'weekly')}>
                  {getFrequencyLabel((booking.recurrence_rule as any)?.frequency || 'weekly')}
                </Badge>
                <span className="text-sm text-gray-400">
                  until {format(new Date((booking.recurrence_rule as any)?.end_date || new Date()), 'MMM dd, yyyy')}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-400">Next occurrence: </span>
                  <span className="text-white">
                    {format(new Date(booking.start_time), 'MMM dd, yyyy')} at{' '}
                    {format(new Date(booking.start_time), 'HH:mm')}
                  </span>
                </div>
                <div className="text-gray-400">
                  {booking.child_bookings_count + 1} total bookings
                </div>
              </div>

              {booking.equipment_needed && Array.isArray(booking.equipment_needed) && booking.equipment_needed.length > 0 && (
                <div>
                  <span className="text-sm text-gray-400">Equipment: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {booking.equipment_needed.map((equipment, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {String(equipment)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {booking.meeting_agenda && (
                <div>
                  <span className="text-sm text-gray-400">Agenda: </span>
                  <p className="text-sm text-gray-300 mt-1">{booking.meeting_agenda}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {recurringBookings.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Repeat className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No recurring bookings found. Create a recurring booking to see it here.</p>
        </div>
      )}
    </div>
  );
};

export default RecurringBookingsView;