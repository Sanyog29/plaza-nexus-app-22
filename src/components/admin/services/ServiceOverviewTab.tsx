import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Clock, User, DollarSign, Star } from 'lucide-react';

interface ServiceBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number;
  rating: number;
  service_items: {
    name: string;
    service_categories: {
      name: string;
    };
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
  service_providers: {
    provider_name: string;
  };
}

const ServiceOverviewTab = () => {
  const [recentBookings, setRecentBookings] = useState<ServiceBooking[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    completedToday: 0,
    averageRating: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServiceData();
  }, []);

  const fetchServiceData = async () => {
    try {
      // Fetch recent bookings with related data
      const { data: bookings, error: bookingsError } = await supabase
        .from('service_bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          status,
          total_amount,
          rating,
          service_items (
            name,
            service_categories (
              name
            )
          ),
          profiles (
            first_name,
            last_name
          ),
          service_providers (
            provider_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (bookingsError) throw bookingsError;

      // Calculate statistics
      const { data: allBookings, error: statsError } = await supabase
        .from('service_bookings')
        .select('status, total_amount, rating, completed_at');

      if (statsError) throw statsError;

      const today = new Date().toISOString().split('T')[0];
      const completedToday = allBookings?.filter(booking => 
        booking.completed_at && booking.completed_at.startsWith(today)
      ).length || 0;

      const pendingBookings = allBookings?.filter(booking => 
        booking.status === 'pending'
      ).length || 0;

      const completedBookings = allBookings?.filter(booking => 
        booking.status === 'completed' && booking.rating
      ) || [];

      const averageRating = completedBookings.length > 0 
        ? completedBookings.reduce((sum, booking) => sum + (booking.rating || 0), 0) / completedBookings.length
        : 0;

      const totalRevenue = allBookings?.reduce((sum, booking) => 
        sum + (booking.total_amount || 0), 0
      ) || 0;

      setRecentBookings(bookings || []);
      setStats({
        totalBookings: allBookings?.length || 0,
        pendingBookings,
        completedToday,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching service data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'in_progress':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-card/50">
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Recent bookings skeleton */}
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Total Bookings</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.totalBookings}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Pending</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.pendingBookings}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Completed Today</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.completedToday}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Avg Rating</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.averageRating}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Revenue</span>
            </div>
            <div className="text-2xl font-bold text-foreground">₹{stats.totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found
              </div>
            ) : (
              recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-foreground">
                        {booking.service_items?.name}
                      </span>
                      <Badge variant="outline" className={getStatusColor(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>
                          {booking.profiles?.first_name} {booking.profiles?.last_name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(booking.booking_date), 'MMM d')}, {booking.booking_time}
                        </span>
                      </div>
                      {booking.service_providers && (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>Provider: {booking.service_providers.provider_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {booking.total_amount && (
                      <span className="font-medium text-foreground">
                        ₹{booking.total_amount}
                      </span>
                    )}
                    {booking.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm font-medium">{booking.rating}</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceOverviewTab;