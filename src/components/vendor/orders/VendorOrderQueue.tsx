import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Filter,
  BarChart3,
  Archive,
  Bell
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import OrderCard from './OrderCard';
import OrderFilters from './OrderFilters';

interface VendorOrderQueueProps {
  vendorId: string;
}

const VendorOrderQueue: React.FC<VendorOrderQueueProps> = ({ vendorId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [orderTimelines, setOrderTimelines] = useState<{ [key: string]: any[] }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

  useEffect(() => {
    fetchOrders();
    // Set up real-time subscription
    const subscription = supabase
      .channel('vendor-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cafeteria_orders',
        filter: `vendor_id=eq.${vendorId}`
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [vendorId]);

  useEffect(() => {
    fetchOrderTimelines();
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cafeteria_orders')
        .select(`
          *,
          order_items (
            id,
            item_id,
            quantity,
            unit_price,
            notes,
            special_instructions
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOrderTimelines = async () => {
    if (orders.length === 0) return;

    try {
      const orderIds = orders.map(order => order.id);
      const { data, error } = await supabase
        .from('order_timeline')
        .select('*')
        .in('order_id', orderIds)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Group timeline by order_id
      const timelinesByOrder = (data || []).reduce((acc, timeline) => {
        if (!acc[timeline.order_id]) {
          acc[timeline.order_id] = [];
        }
        acc[timeline.order_id].push(timeline);
        return acc;
      }, {} as { [key: string]: any[] });

      setOrderTimelines(timelinesByOrder);
    } catch (error: any) {
      console.error('Error fetching order timelines:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter(order => 
        !['completed', 'cancelled'].includes(order.status.toLowerCase())
      );
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(order => 
        ['completed', 'cancelled'].includes(order.status.toLowerCase())
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status.toLowerCase() === statusFilter);
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) >= dateRange.from!
      );
    }
    if (dateRange.to) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) <= dateRange.to!
      );
    }

    // Amount range filter
    if (amountRange.min) {
      filtered = filtered.filter(order => 
        order.total_amount >= parseFloat(amountRange.min)
      );
    }
    if (amountRange.max) {
      filtered = filtered.filter(order => 
        order.total_amount <= parseFloat(amountRange.max)
      );
    }

    return filtered;
  };

  const getOrderStats = () => {
    const activeOrders = orders.filter(order => 
      !['completed', 'cancelled'].includes(order.status.toLowerCase())
    );
    
    const pendingCount = activeOrders.filter(order => order.status === 'pending').length;
    const preparingCount = activeOrders.filter(order => order.status === 'preparing').length;
    const readyCount = activeOrders.filter(order => order.status === 'ready').length;
    
    const avgPrepTime = orders.length > 0 ? 15 : 0; // Mock calculation
    
    return {
      active: activeOrders.length,
      pending: pendingCount,
      preparing: preparingCount,
      ready: readyCount,
      avgPrepTime
    };
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateRange({});
    setAmountRange({ min: '', max: '' });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (dateRange.from || dateRange.to) count++;
    if (amountRange.min || amountRange.max) count++;
    return count;
  };

  const filteredOrders = getFilteredOrders();
  const stats = getOrderStats();
  const activeFiltersCount = getActiveFiltersCount();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Order Queue</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Order Management</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={activeFiltersCount > 0 ? 'border-primary' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.preparing}</p>
                <p className="text-sm text-muted-foreground">Preparing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.ready}</p>
                <p className="text-sm text-muted-foreground">Ready</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.avgPrepTime}m</p>
                <p className="text-sm text-muted-foreground">Avg Prep Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <OrderFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          amountRange={amountRange}
          onAmountRangeChange={setAmountRange}
          activeFiltersCount={activeFiltersCount}
          onClearFilters={clearFilters}
        />
      )}

      {/* Orders Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Active Orders ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Order History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active orders</h3>
                <p className="text-muted-foreground">
                  {activeFiltersCount > 0 
                    ? "No orders match your current filters."
                    : "New orders will appear here when they come in."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                  onOrderUpdate={fetchOrders}
                  timeline={orderTimelines[order.id] || []}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No completed orders</h3>
                <p className="text-muted-foreground">
                  Completed and cancelled orders will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                  onOrderUpdate={fetchOrders}
                  timeline={orderTimelines[order.id] || []}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorOrderQueue;