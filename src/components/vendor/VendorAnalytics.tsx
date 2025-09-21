import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, DollarSign, ShoppingCart, Star, Clock, TrendingUp, Users, Brain, Package, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import SalesChart from './analytics/SalesChart';
import MetricsGrid from './analytics/MetricsGrid';
import DemandForecast from './intelligence/DemandForecast';
import SmartInventory from './intelligence/SmartInventory';
import PerformanceBenchmarking from './intelligence/PerformanceBenchmarking';

interface VendorAnalyticsProps {
  vendorId: string;
}

const VendorAnalytics: React.FC<VendorAnalyticsProps> = ({ vendorId }) => {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [vendorId, period]);

  // Set up real-time updates for analytics data
  useEffect(() => {
    const channel = supabase
      .channel(`vendor-analytics-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'cafeteria_orders',
          filter: `vendor_id=eq.${vendorId}`
        },
        () => {
          console.log('Analytics: Order update received, refreshing data');
          fetchAnalytics(); // Refresh analytics when orders change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch analytics data
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('vendor_analytics')
        .select('*')
        .eq('vendor_id', vendorId)
        .gte('metric_date', startDate.toISOString().split('T')[0])
        .lte('metric_date', endDate.toISOString().split('T')[0])
        .order('metric_date', { ascending: true });

      if (analyticsError) throw analyticsError;

      // Fetch orders data for additional metrics
      const { data: ordersData, error: ordersError } = await supabase
        .from('cafeteria_orders')
        .select(`
          id,
          total_amount,
          status,
          payment_status,
          created_at,
          order_feedback (
            overall_rating,
            customer_satisfaction_score
          )
        `)
        .eq('vendor_id', vendorId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['completed', 'paid']);

      if (ordersError) throw ordersError;

      setAnalytics(analyticsData || []);
      
      // Process data for charts
      const chartData = (analyticsData || []).map(item => ({
        date: item.metric_date,
        revenue: item.total_revenue,
        orders: item.total_orders,
        avg_order_value: item.average_order_value,
        satisfaction: item.customer_satisfaction_avg
      }));

      setSalesData(chartData);
      
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    if (!analytics.length) return [];

    const totalRevenue = analytics.reduce((sum, item) => sum + Number(item.total_revenue), 0);
    const totalOrders = analytics.reduce((sum, item) => sum + Number(item.total_orders), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const avgSatisfaction = analytics.reduce((sum, item) => sum + Number(item.customer_satisfaction_avg), 0) / analytics.length;

    // Calculate commission at 10%
    const totalCommission = totalRevenue * 0.1;

    // Calculate changes (compare with previous period)
    const midPoint = Math.floor(analytics.length / 2);
    const firstHalf = analytics.slice(0, midPoint);
    const secondHalf = analytics.slice(midPoint);

    const firstHalfRevenue = firstHalf.reduce((sum, item) => sum + Number(item.total_revenue), 0);
    const secondHalfRevenue = secondHalf.reduce((sum, item) => sum + Number(item.total_revenue), 0);
    const revenueChange = firstHalfRevenue > 0 ? ((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100 : 0;

    const firstHalfOrders = firstHalf.reduce((sum, item) => sum + Number(item.total_orders), 0);
    const secondHalfOrders = secondHalf.reduce((sum, item) => sum + Number(item.total_orders), 0);
    const ordersChange = firstHalfOrders > 0 ? ((secondHalfOrders - firstHalfOrders) / firstHalfOrders) * 100 : 0;

    return [
      {
        title: 'Total Revenue',
        value: totalRevenue,
        change: revenueChange,
        icon: <DollarSign className="h-4 w-4" />,
        format: 'currency' as const
      },
      {
        title: 'Total Orders',
        value: totalOrders,
        change: ordersChange,
        icon: <ShoppingCart className="h-4 w-4" />,
        format: 'number' as const
      },
      {
        title: 'Avg Order Value',
        value: avgOrderValue,
        icon: <TrendingUp className="h-4 w-4" />,
        format: 'currency' as const
      },
      {
        title: 'Commission Earned',
        value: totalCommission,
        change: revenueChange, // Same as revenue change
        icon: <DollarSign className="h-4 w-4 text-success" />,
        format: 'currency' as const
      },
      {
        title: 'Customer Rating',
        value: avgSatisfaction,
        icon: <Star className="h-4 w-4" />,
        format: 'number' as const
      }
    ];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Analytics & Reports</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Analytics & Reports</h2>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <MetricsGrid metrics={metrics} />

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="forecast">AI Forecast</TabsTrigger>
          <TabsTrigger value="intelligence">Business Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <SalesChart
            data={salesData}
            title="Revenue Over Time"
            dataKey="revenue"
            period={period}
            onPeriodChange={setPeriod}
            type="line"
          />
          
          <SalesChart
            data={salesData}
            title="Average Order Value"
            dataKey="avg_order_value"
            period={period}
            onPeriodChange={setPeriod}
            type="bar"
          />
        </TabsContent>

        <TabsContent value="commission" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-success" />
                  Commission Overview (10% Rate)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Commission</span>
                    <span className="font-semibold text-success text-lg">
                      ₹{(analytics.reduce((sum, item) => sum + Number(item.total_revenue), 0) * 0.1).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Daily Average</span>
                    <span className="font-semibold">
                      ₹{analytics.length > 0 ? ((analytics.reduce((sum, item) => sum + Number(item.total_revenue), 0) * 0.1) / analytics.length).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Commission Rate</span>
                    <span className="font-semibold text-success">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Commission Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Best Day Commission</span>
                    <span className="font-semibold">
                      ₹{analytics.length > 0 ? (Math.max(...analytics.map(d => Number(d.total_revenue))) * 0.1).toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Growth Rate</span>
                    <span className={`font-semibold ${metrics.find(m => m.title === 'Total Revenue')?.change >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {metrics.find(m => m.title === 'Total Revenue')?.change >= 0 ? '+' : ''}{metrics.find(m => m.title === 'Total Revenue')?.change?.toFixed(1) || '0'}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Revenue Share</span>
                    <span className="font-semibold">90% to vendor</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <SalesChart
            data={salesData.map(item => ({ ...item, commission: item.revenue * 0.1 }))}
            title="Commission Earnings Over Time"
            dataKey="commission"
            period={period}
            onPeriodChange={setPeriod}
            type="line"
          />
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <SalesChart
            data={salesData}
            title="Orders Over Time"
            dataKey="orders"
            period={period}
            onPeriodChange={setPeriod}
            type="bar"
          />
        </TabsContent>

        <TabsContent value="satisfaction" className="space-y-6">
          <SalesChart
            data={salesData}
            title="Customer Satisfaction"
            dataKey="satisfaction"
            period={period}
            onPeriodChange={setPeriod}
            type="line"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Rated Items</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Customer Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Fulfillment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">94.5%</div>
                <p className="text-sm text-muted-foreground">On-time delivery rate</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Avg Preparation Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">18 min</div>
                <p className="text-sm text-muted-foreground">Average order prep time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Peak Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12-2 PM</div>
                <p className="text-sm text-muted-foreground">Busiest time period</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Return Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">67%</div>
                <p className="text-sm text-muted-foreground">Customer retention rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <DemandForecast vendorId={vendorId} />
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-6">
          <Tabs defaultValue="inventory" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Smart Inventory
              </TabsTrigger>
              <TabsTrigger value="benchmarking" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Performance Benchmarking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory">
              <SmartInventory vendorId={vendorId} />
            </TabsContent>

            <TabsContent value="benchmarking">
              <PerformanceBenchmarking vendorId={vendorId} />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorAnalytics;