import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building, Calendar, Users, DollarSign, TrendingUp, Settings } from 'lucide-react';

const AdminServicesPage = () => {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services Management</h1>
          <p className="text-muted-foreground">Manage building services, providers, and tenant bookings</p>
        </div>
        <Button>
          <Settings className="mr-2 h-4 w-4" />
          Configure Services
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">+5 today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">3 new this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹85,000</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">+0.3 this quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="providers">Service Providers</TabsTrigger>
          <TabsTrigger value="categories">Service Categories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest service bookings from tenants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { service: 'Conference Room A', tenant: 'Tech Corp', time: '2:00 PM - 4:00 PM', status: 'Confirmed' },
                  { service: 'Cleaning Service', tenant: 'Marketing Inc', time: '9:00 AM', status: 'In Progress' },
                  { service: 'IT Support', tenant: 'Design Studio', time: '11:30 AM', status: 'Pending' },
                ].map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{booking.service}</p>
                      <p className="text-sm text-muted-foreground">{booking.tenant} • {booking.time}</p>
                    </div>
                    <Badge variant={booking.status === 'Confirmed' ? 'secondary' : booking.status === 'In Progress' ? 'outline' : 'destructive'}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Service Categories</CardTitle>
                <CardDescription>Most popular service categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { category: 'Meeting Rooms', bookings: 45, revenue: '₹25,000' },
                  { category: 'Cleaning Services', bookings: 32, revenue: '₹18,000' },
                  { category: 'IT Support', bookings: 28, revenue: '₹22,000' },
                  { category: 'Catering', bookings: 15, revenue: '₹12,000' },
                ].map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{category.category}</p>
                      <p className="text-sm text-muted-foreground">{category.bookings} bookings this month</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{category.revenue}</p>
                      <p className="text-sm text-muted-foreground">revenue</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>All Service Bookings</CardTitle>
              <CardDescription>Manage and track all service bookings across the building</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Service bookings management interface would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>Service Providers</CardTitle>
              <CardDescription>Manage service providers, contracts, and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Service provider management interface would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
              <CardDescription>Configure available service categories and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Service categories configuration interface would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Services Analytics</CardTitle>
              <CardDescription>Performance metrics and insights for building services</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Services analytics dashboard would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminServicesPage;