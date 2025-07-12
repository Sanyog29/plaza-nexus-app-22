import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Search, Filter, Clock, User, MapPin, Phone } from 'lucide-react';

interface ServiceBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  assigned_at: string;
  started_at: string;
  completed_at: string;
  service_items: {
    name: string;
    duration_minutes: number;
    service_categories: {
      name: string;
    };
  };
  profiles: {
    first_name: string;
    last_name: string;
    phone_number: string;
  };
  service_providers: {
    provider_name: string;
    contact_phone: string;
  };
}

const ServiceBookingsTab = () => {
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ServiceBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    fetchBookings();
    fetchProviders();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          status,
          total_amount,
          notes,
          created_at,
          assigned_at,
          started_at,
          completed_at,
          service_items (
            name,
            duration_minutes,
            service_categories (
              name
            )
          ),
          profiles (
            first_name,
            last_name,
            phone_number
          ),
          service_providers (
            provider_name,
            contact_phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select('id, provider_name')
        .eq('is_active', true);

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.service_items?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${booking.profiles?.first_name} ${booking.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service_providers?.provider_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('service_bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });

      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    }
  };

  const assignProvider = async (bookingId: string, providerId: string) => {
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({
          service_provider_id: providerId,
          assigned_at: new Date().toISOString(),
          status: 'confirmed'
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Provider assigned successfully",
      });

      fetchBookings();
    } catch (error) {
      console.error('Error assigning provider:', error);
      toast({
        title: "Error",
        description: "Failed to assign provider",
        variant: "destructive",
      });
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
      <Card className="bg-card/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-foreground">
            Service Bookings ({filteredBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bookings found
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 bg-background/50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-foreground">
                          {booking.service_items?.name}
                        </h3>
                        <Badge variant="outline" className={getStatusColor(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>
                            {booking.profiles?.first_name} {booking.profiles?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(booking.booking_date), 'MMM d')}, {booking.booking_time}
                          </span>
                        </div>
                        {booking.profiles?.phone_number && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{booking.profiles.phone_number}</span>
                          </div>
                        )}
                      </div>

                      {booking.service_providers && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Assigned to:</span> {booking.service_providers.provider_name}
                        </div>
                      )}

                      {booking.notes && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Notes:</span> {booking.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <Select onValueChange={(value) => assignProvider(booking.id, value)}>
                            <SelectTrigger className="w-full sm:w-48">
                              <SelectValue placeholder="Assign Provider" />
                            </SelectTrigger>
                            <SelectContent>
                              {providers.map((provider: any) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  {provider.provider_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}

                      {booking.status === 'confirmed' && (
                        <Button
                          onClick={() => updateBookingStatus(booking.id, 'in_progress')}
                          variant="outline"
                          size="sm"
                        >
                          Start Service
                        </Button>
                      )}

                      {booking.status === 'in_progress' && (
                        <Button
                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                          variant="outline"
                          size="sm"
                        >
                          Mark Complete
                        </Button>
                      )}

                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
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

export default ServiceBookingsTab;