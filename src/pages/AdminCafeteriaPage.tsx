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
  TrendingUp, 
  Users,
  AlertTriangle,
  Star,
  Building,
  Calendar
} from 'lucide-react';
import AdminVendorManagement from '@/components/admin/AdminVendorManagement';
import AdminFinancialReports from '@/components/admin/AdminFinancialReports';
import AdminOrderOverview from '@/components/admin/AdminOrderOverview';
import { SEOHead } from '@/components/seo/SEOHead';

const AdminCafeteriaPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Get aggregated metrics for today
  const { data: todayMetrics } = useQuery({
    queryKey: ['admin-today-metrics'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: orders, error } = await supabase
        .from('cafeteria_orders')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const totalCommission = orders?.reduce((sum, order) => sum + Number(order.commission_amount || 0), 0) || 0;
      const pendingOrders = orders?.filter(order => ['pending_payment', 'confirmed', 'preparing'].includes(order.status)).length || 0;

      return {
        totalOrders,
        totalRevenue,
        totalCommission,
        pendingOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
      };
    },
  });

  // Get vendor statistics
  const { data: vendorStats } = useQuery({
    queryKey: ['admin-vendor-stats'],
    queryFn: async () => {
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*');

      if (error) throw error;

      const activeVendors = vendors?.filter(v => v.is_active).length || 0;
      const totalVendors = vendors?.length || 0;
      const averageRating = vendors?.reduce((sum, vendor) => sum + (vendor.average_rating || 0), 0) / totalVendors || 0;

      return {
        activeVendors,
        totalVendors,
        averageRating,
        inactiveVendors: totalVendors - activeVendors
      };
    },
  });

  // Get recent orders for quick overview
  const { data: recentOrders = [] } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafeteria_orders')
        .select(`
          *,
          vendor:vendors(name, logo_url)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'ready': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Cafeteria Admin"
        description="Admin tools for multi-vendor food court management."
        url={`${window.location.origin}/admin/cafeteria`}
        type="website"
        noindex
      />
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Cafeteria Admin</h1>
              <p className="text-muted-foreground">Multi-vendor food court management</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className="bg-green-500">
                System Active
              </Badge>
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{todayMetrics?.totalRevenue?.toFixed(2) || '0.00'}</div>
                  <p className="text-xs text-muted-foreground">
                    Commission: ₹{todayMetrics?.totalCommission?.toFixed(2) || '0.00'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
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
                  <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vendorStats?.activeVendors || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    of {vendorStats?.totalVendors || 0} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{vendorStats?.averageRating?.toFixed(1) || '0.0'}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all vendors
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Latest orders across all vendors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentOrders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {order.vendor?.logo_url && (
                          <img 
                            src={order.vendor.logo_url} 
                            alt={`${order.vendor.name} logo`}
                            width={32}
                            height={32}
                            loading="lazy"
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-foreground">
                            {order.vendor?.name || 'Unknown Vendor'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.id.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <span className="font-semibold">₹{order.total_amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setActiveTab('orders')}
                >
                  View All Orders
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vendor Management</CardTitle>
                  <CardDescription>
                    Add, edit, or manage vendor accounts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => setActiveTab('vendors')}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Vendors
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial Reports</CardTitle>
                  <CardDescription>
                    Commission tracking and payouts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full"
                    onClick={() => setActiveTab('reports')}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Alerts</CardTitle>
                  <CardDescription>
                    Monitor system health and issues
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Check Alerts
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vendors">
            <AdminVendorManagement />
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrderOverview />
          </TabsContent>

          <TabsContent value="reports">
            <AdminFinancialReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminCafeteriaPage;