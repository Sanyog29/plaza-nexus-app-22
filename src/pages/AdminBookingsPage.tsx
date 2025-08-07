import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  BarChart3,
  Download
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { SEOHead } from '@/components/seo/SEOHead';

const AdminBookingsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all bookings for admin management
  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['admin-bookings', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('room_bookings')
        .select(`
          *,
          rooms!inner (
            name,
            location,
            capacity
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching bookings:', error);
        throw error;
      }
      
      return data;
    }
  });

  // Filter bookings based on search term
  const filteredBookings = bookings?.filter(booking =>
    booking.rooms?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleStatusChange = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('room_bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success(`Booking ${newStatus} successfully`);
      refetch();
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { variant: 'default' as const, color: 'text-green-600', label: 'Confirmed' },
      pending: { variant: 'secondary' as const, color: 'text-yellow-600', label: 'Pending' },
      cancelled: { variant: 'destructive' as const, color: 'text-red-600', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const statsData = React.useMemo(() => {
    if (!bookings) return { total: 0, confirmed: 0, pending: 0, cancelled: 0 };

    return bookings.reduce((acc, booking) => {
      acc.total++;
      acc[booking.status as keyof typeof acc]++;
      return acc;
    }, { total: 0, confirmed: 0, pending: 0, cancelled: 0 });
  }, [bookings]);

  return (
    <>
      <SEOHead
        title="Booking Management"
        description="Manage all room bookings and reservations."
        url={`${window.location.origin}/admin/bookings`}
        type="website"
        noindex
      />
      <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Booking Management</h1>
          <p className="text-muted-foreground">Manage all room bookings and reservations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-2xl font-bold">{statsData.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">{statsData.confirmed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{statsData.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{statsData.cancelled}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookings by room, user, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('confirmed')}
          >
            Confirmed
          </Button>
          <Button
            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled
          </Button>
        </div>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-6">
                    <div>
                      <h3 className="font-medium">{booking.rooms?.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {booking.rooms?.location}
                        <Users className="h-3 w-3 ml-2" />
                        {booking.rooms?.capacity} people
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {booking.title || 'Meeting'}
                      </p>
                      <p className="text-sm text-muted-foreground">User: {booking.user_id}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(booking.start_time), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {booking.start_time} - {booking.end_time}
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 sm:mt-0">
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusChange(booking.id, 'cancelled')}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {booking.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusChange(booking.id, 'cancelled')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </>
  );
};

export default AdminBookingsPage;