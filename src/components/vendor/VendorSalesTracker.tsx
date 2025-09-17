import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingCart, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SalesMetrics {
  todaySales: number;
  todayOrders: number;
  avgOrderValue: number;
  pendingOrders: number;
}

interface VendorSalesTrackerProps {
  vendorId: string;
}

const VendorSalesTracker: React.FC<VendorSalesTrackerProps> = ({ vendorId }) => {
  const [metrics, setMetrics] = useState<SalesMetrics>({
    todaySales: 0,
    todayOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchSalesMetrics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's completed/paid orders
      const { data: completedOrders } = await supabase
        .from('cafeteria_orders')
        .select('total_amount')
        .eq('vendor_id', vendorId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .in('status', ['completed', 'paid']);

      // Fetch pending orders
      const { data: pendingOrders } = await supabase
        .from('cafeteria_orders')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('status', 'pending');

      const todaySales = completedOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const todayOrders = completedOrders?.length || 0;
      const avgOrderValue = todayOrders > 0 ? todaySales / todayOrders : 0;
      const pendingCount = pendingOrders?.length || 0;

      setMetrics({
        todaySales,
        todayOrders,
        avgOrderValue,
        pendingOrders: pendingCount
      });
    } catch (error) {
      console.error('Error fetching sales metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesMetrics();
  }, [vendorId]);

  // Set up real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`sales-tracker-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cafeteria_orders',
          filter: `vendor_id=eq.${vendorId}`
        },
        () => {
          console.log('Sales tracker: Order update received, refreshing metrics');
          fetchSalesMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
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
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{metrics.todaySales.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Total revenue today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.todayOrders}</div>
          <p className="text-xs text-muted-foreground">
            Completed orders
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{metrics.avgOrderValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Average per order
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.pendingOrders}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting payment
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSalesTracker;