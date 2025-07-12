import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  Star,
  TrendingUp,
  Users,
  Bell,
  Settings
} from 'lucide-react';
import VendorOrderQueue from '@/components/vendor/VendorOrderQueue';
import VendorMenuManagement from '@/components/vendor/VendorMenuManagement';
import VendorAnalytics from '@/components/vendor/VendorAnalytics';

const VendorPortalPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Get current vendor info
  const { data: vendorInfo } = useQuery({
    queryKey: ['vendor-info'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('vendor_staff')
        .select(`
          *,
          vendor:vendors(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Get today's metrics
  const { data: todayMetrics } = useQuery({
    queryKey: ['vendor-today-metrics', vendorInfo?.vendor_id],
    queryFn: async () => {
      if (!vendorInfo?.vendor_id) return null;

      const today = new Date().toISOString().split('T')[0];
      
      const { data: orders, error } = await supabase
        .from('cafeteria_orders')
        .select('*')
        .eq('vendor_id', vendorInfo.vendor_id)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const pendingOrders = orders?.filter(order => ['pending_payment', 'confirmed'].includes(order.status)).length || 0;
      const completedOrders = orders?.filter(order => order.status === 'completed').length || 0;

      return {
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      };
    },
    enabled: !!vendorInfo?.vendor_id,
  });

  if (!vendorInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Vendor Access Required</h2>
            <p className="text-muted-foreground mb-4">
              Your account is not linked to any vendor business. Please contact your administrator to set up vendor access.
            </p>
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
              <p className="font-medium mb-2">To access the vendor portal, you need:</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li>Registration as vendor staff</li>
                <li>Assignment to a vendor business</li>
                <li>Appropriate access permissions</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vendor = vendorInfo.vendor;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {vendor.logo_url && (
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">{vendor.name}</h1>
                <p className="text-gray-400">{vendor.cuisine_type} • {vendor.stall_location}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={vendor.is_active ? 'default' : 'secondary'}>
                {vendor.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{todayMetrics?.totalRevenue?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayMetrics?.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {todayMetrics?.pendingOrders || 0} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{todayMetrics?.averageOrderValue?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    +5% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vendor.average_rating?.toFixed(1) || '0.0'}</div>
                  <p className="text-xs text-muted-foreground">
                    {vendor.total_orders || 0} total orders
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your restaurant operations efficiently
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Button onClick={() => setActiveTab('orders')}>
                  <Clock className="h-4 w-4 mr-2" />
                  View Orders ({todayMetrics?.pendingOrders || 0})
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('menu')}>
                  Update Menu
                </Button>
                <Button variant="outline">
                  Create Offer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <VendorOrderQueue vendorId={vendor.id} />
          </TabsContent>

          <TabsContent value="menu">
            <VendorMenuManagement vendorId={vendor.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <VendorAnalytics vendorId={vendor.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VendorPortalPage;