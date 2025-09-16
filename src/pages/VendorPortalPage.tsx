import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, NavLink, useLocation } from 'react-router-dom';
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
  Settings,
  LayoutDashboard,
  ShoppingCart,
  BarChart3,
  CreditCard,
  Table2,
  ChefHat,
  LogOut
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import VendorOrderQueue from '@/components/vendor/VendorOrderQueue';
import VendorMenuManagement from '@/components/vendor/VendorMenuManagement';
import VendorAnalytics from '@/components/vendor/VendorAnalytics';
import VendorHeader from '@/components/vendor/VendorHeader';
import VendorSalesTracker from '@/components/vendor/VendorSalesTracker';
import VendorStoreSetup from '@/components/vendor/VendorStoreSetup';
import VendorPOS from '@/components/vendor/VendorPOS';
import VendorQRUpload from '@/components/vendor/VendorQRUpload';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navigation = [
  { name: 'Dashboard', value: 'dashboard', icon: LayoutDashboard },
  { name: 'POS', value: 'pos', icon: ShoppingCart },
  { name: 'Orders', value: 'orders', icon: ShoppingBag },
  { name: 'Menu', value: 'menu', icon: ChefHat },
  { name: 'Store Setup', value: 'store', icon: Settings },
  { name: 'Sales', value: 'sales', icon: TrendingUp },
  { name: 'Analytics', value: 'analytics', icon: BarChart3 },
];

function VendorSidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  return (
    <Sidebar className="w-64 h-full border-r bg-background" collapsible="none">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-lg font-semibold">
            Vendor Portal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton 
                    asChild 
                    className={activeTab === item.value ? 'bg-accent text-accent-foreground' : ''}
                  >
                    <button 
                      onClick={() => onTabChange(item.value)}
                      className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full text-left"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const VendorPortalPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Handle URL-based tab navigation and clear cart
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    const clearCart = searchParams.get('clearCart');
    
    if (tabFromUrl && ['dashboard', 'pos', 'orders', 'menu', 'store', 'sales', 'analytics'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
    
    // If clearCart parameter is present, switch to POS tab and clear URL params after a delay
    if (clearCart === 'true') {
      setActiveTab('pos');
      // Clear the clearCart parameter from URL after processing
      setTimeout(() => {
        setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('clearCart');
          return newParams;
        });
      }, 100);
    }
  }, [searchParams, setSearchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'dashboard' ? {} : { tab });
  };

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
        .limit(1)
        .single();

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
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <VendorSidebar activeTab={activeTab} onTabChange={handleTabChange} />
        
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-background flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">{vendor.name}</h1>
              <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
                Active
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Badge variant="outline">
                {todayMetrics?.pendingOrders || 0} pending orders
              </Badge>
            </div>
          </header>
            
            <main className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full">
                <div className="h-full">{/* Remove TabsList since navigation is in sidebar */}

            <TabsContent value="dashboard" className="p-6 space-y-6 h-full overflow-auto">
              {/* Sales Tracker */}
              <VendorSalesTracker vendorId={vendor.id} />

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Manage your restaurant operations efficiently
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                  <Button onClick={() => handleTabChange('orders')}>
                    <Clock className="h-4 w-4 mr-2" />
                    View Orders ({todayMetrics?.pendingOrders || 0})
                  </Button>
                  <Button variant="outline" onClick={() => handleTabChange('menu')}>
                    Update Menu
                  </Button>
                  <Button variant="outline">
                    Create Offer
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pos" className="h-full p-0">
              <VendorPOS vendorId={vendor.id} />
            </TabsContent>

            <TabsContent value="orders" className="p-6 h-full overflow-auto">
              <VendorOrderQueue vendorId={vendor.id} />
            </TabsContent>

            <TabsContent value="menu" className="p-6 h-full overflow-auto">
              <VendorMenuManagement vendorId={vendor.id} />
            </TabsContent>

            <TabsContent value="store" className="p-6 h-full overflow-auto">
              <div className="space-y-6">
                <VendorStoreSetup vendorId={vendor.id} />
                <VendorQRUpload 
                  vendorId={vendor.id}
                  currentQRUrl={(vendor.store_config as any)?.custom_qr_url}
                  onUploadSuccess={() => {
                    // Refresh vendor data to get updated QR URL
                    window.location.reload();
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="sales" className="p-6 h-full overflow-auto">
              <VendorSalesTracker vendorId={vendor.id} />
            </TabsContent>

            <TabsContent value="analytics" className="p-6 h-full overflow-auto">
              <VendorAnalytics vendorId={vendor.id} />
            </TabsContent>
                </div>
              </Tabs>
            </main>
          </div>
        </div>
    </SidebarProvider>
  );
  };

export default VendorPortalPage;