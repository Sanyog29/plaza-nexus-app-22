
import React, { useState, useEffect } from 'react';
import { Car, CalendarClock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { format } from 'date-fns';

interface ServiceBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  service_items: {
    name: string;
    service_categories: {
      name: string;
      icon: string;
    };
  };
}

const RecentBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecentBookings();
    }
  }, [user]);

  const fetchRecentBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          status,
          service_items (
            name,
            service_categories (
              name,
              icon
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-500 border-green-500';
      case 'pending':
        return 'text-yellow-500 border-yellow-500';
      case 'completed':
        return 'text-blue-500 border-blue-500';
      case 'cancelled':
        return 'text-red-500 border-red-500';
      default:
        return 'text-gray-500 border-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-white">Recent Bookings</h3>
          </div>
          <div className="animate-pulse space-y-2">
            <div className="h-16 bg-card/60 rounded-md"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur mb-6">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium text-white">Recent Bookings</h3>
          <Button variant="link" className="text-plaza-blue p-0">View All</Button>
        </div>
        <div className="space-y-2">
          {bookings.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              No recent bookings found
            </div>
          ) : (
            bookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-2 rounded-md bg-card/60">
                <div className="flex items-center gap-3">
                  <div className="bg-plaza-blue bg-opacity-20 p-2 rounded-full">
                    <Car size={18} className="text-plaza-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{booking.service_items?.name}</p>
                    <div className="flex items-center text-xs text-gray-400">
                      <CalendarClock size={12} className="mr-1" />
                      <span>
                        {format(new Date(booking.booking_date), 'MMM d')}, {booking.booking_time}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className={getStatusColor(booking.status)}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentBookings;
