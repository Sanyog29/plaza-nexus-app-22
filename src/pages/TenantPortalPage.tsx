import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Home, 
  Calendar, 
  Wrench, 
  CreditCard, 
  MessageSquare,
  Bell,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Coffee
} from 'lucide-react';
import TenantRoomBooking from '@/components/tenant/TenantRoomBooking';
import TenantServiceRequests from '@/components/tenant/TenantServiceRequests';
import TenantBilling from '@/components/tenant/TenantBilling';
import TenantNotifications from '@/components/tenant/TenantNotifications';
import { MobileTenantDashboard } from '@/components/tenant/mobile/MobileTenantDashboard';
import { MobileTenantTabs } from '@/components/tenant/mobile/MobileTenantTabs';

const TenantPortalPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const isMobile = useIsMobile();

  // Mock tenant info for demo
  const tenantInfo = {
    id: 'tenant-1',
    tenant: {
      id: 'tenant-1',
      company_name: 'Demo Company Ltd.',
      floor_number: '3',
      square_footage: 2500
    }
  };

  // Mock dashboard metrics
  const dashboardMetrics = {
    activeBookings: 2,
    pendingRequests: 1,
    unreadNotifications: 3,
    todayBookings: [],
    recentNotifications: []
  };

  if (!tenantInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Tenant Access Required</h2>
            <p className="text-muted-foreground">
              Your account is not linked to any tenant. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tenant = tenantInfo.tenant;

  // Mobile view
  if (isMobile) {
    const tabComponents = {
      dashboard: <MobileTenantDashboard />,
      booking: <TenantRoomBooking tenantId={tenant.id} />,
      requests: <TenantServiceRequests tenantId={tenant.id} />,
      services: <div className="p-4 text-center space-y-4">
        <div className="p-6 bg-primary/5 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Building Services</h3>
          <p className="text-muted-foreground mb-4">Cafeteria, amenities, and other building services coming soon!</p>
          <Button variant="outline" className="gap-2">
            <Coffee className="h-4 w-4" />
            Explore Services
          </Button>
        </div>
      </div>,
      billing: <TenantBilling tenantId={tenant.id} />,
      notifications: <TenantNotifications tenantId={tenant.id} />
    };

    return (
      <div className="min-h-screen bg-background">
        <MobileTenantTabs tabComponents={tabComponents} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="bg-card border-b border-border/40">
        <div className="w-full px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome, {tenant.company_name}
              </h1>
              <p className="text-muted-foreground">
                {tenant.floor_number ? `Floor ${tenant.floor_number}` : ''} • {tenant.square_footage} sq ft
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500/10 text-green-700">
                Active
              </Badge>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                {dashboardMetrics?.unreadNotifications || 0}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="booking">Room Booking</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics?.activeBookings || 0}</div>
                  <p className="text-xs text-muted-foreground">Today</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Service Requests</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics?.pendingRequests || 0}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardMetrics?.unreadNotifications || 0}</div>
                  <p className="text-xs text-muted-foreground">Unread</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Access frequently used services and features
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button onClick={() => setActiveTab('booking')} className="h-20 flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  Book Room
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('services')} className="h-20 flex-col">
                  <Wrench className="h-6 w-6 mb-2" />
                  Service Request
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('billing')} className="h-20 flex-col">
                  <CreditCard className="h-6 w-6 mb-2" />
                  View Bills
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <MessageSquare className="h-6 w-6 mb-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardMetrics?.todayBookings?.length ? (
                  <div className="space-y-3">
                    {dashboardMetrics.todayBookings.map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{booking.room_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.start_time).toLocaleTimeString()} - 
                              {new Date(booking.end_time).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirmed
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No bookings scheduled for today
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboardMetrics?.recentNotifications?.length ? (
                  <div className="space-y-3">
                    {dashboardMetrics.recentNotifications.map((notification: any) => (
                      <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No recent notifications
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="booking">
            <TenantRoomBooking tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="services">
            <TenantServiceRequests tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="billing">
            <TenantBilling tenantId={tenant.id} />
          </TabsContent>

          <TabsContent value="notifications">
            <TenantNotifications tenantId={tenant.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenantPortalPage;