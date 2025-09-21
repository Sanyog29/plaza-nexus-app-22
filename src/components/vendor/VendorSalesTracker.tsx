import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, ShoppingCart, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SalesMetrics {
  todaySales: number;
  todayOrders: number;
  avgOrderValue: number;
  pendingOrders: number;
  todayCommission: number;
  monthlyRevenue: number;
  monthlyCommission: number;
}

interface VendorSalesTrackerProps {
  vendorId: string;
}

const VendorSalesTracker: React.FC<VendorSalesTrackerProps> = ({ vendorId }) => {
  const [metrics, setMetrics] = useState<SalesMetrics>({
    todaySales: 0,
    todayOrders: 0,
    avgOrderValue: 0,
    pendingOrders: 0,
    todayCommission: 0,
    monthlyRevenue: 0,
    monthlyCommission: 0
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

      // Fetch vendor commission rate
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('commission_rate')
        .eq('id', vendorId)
        .single();

      // Fetch monthly cumulative analytics using the new function
      const { data: monthlyData } = await supabase
        .rpc('get_vendor_cumulative_analytics', {
          p_vendor_id: vendorId,
          p_period: 'monthly'
        });

      const todaySales = completedOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const todayOrders = completedOrders?.length || 0;
      const avgOrderValue = todayOrders > 0 ? todaySales / todayOrders : 0;
      const pendingCount = pendingOrders?.length || 0;
      const commissionRate = vendorData?.commission_rate || 10;
      const todayCommission = (todaySales * commissionRate) / 100;
      
      // Get monthly data from the analytics function
      const monthlyRevenue = monthlyData?.[0]?.total_revenue || 0;
      const monthlyCommission = monthlyData?.[0]?.commission_earned || 0;

      setMetrics({
        todaySales,
        todayOrders,
        avgOrderValue,
        pendingOrders: pendingCount,
        todayCommission,
        monthlyRevenue,
        monthlyCommission
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
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
    <div className="space-y-6">
      {/* Today's Performance */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Today's Performance</h3>
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
      </div>

      {/* Commission & Monthly Performance */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Commission & Monthly Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Commission (10%)</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">₹{metrics.todayCommission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Commission earned today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Commission</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">₹{metrics.monthlyCommission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total commission this month
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorSalesTracker;