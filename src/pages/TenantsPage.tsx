import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  Calendar,
  MessageSquare,
  Settings,
  Bell,
  Search,
  Plus,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  Wifi,
  Car,
  Coffee,
  Shield
} from 'lucide-react';

const TenantsPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newRequest, setNewRequest] = useState({ title: '', description: '', priority: 'medium' });

  // Get tenant info
  const { data: tenantInfo } = useQuery({
    queryKey: ['tenant-info'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Mock tenant data - in real app, fetch from tenants table
      return {
        id: user.id,
        name: 'Tech Innovators Pvt Ltd',
        unit: '4th Floor, Wing A',
        contact_person: 'John Doe',
        email: user.email,
        phone: '+91-9876543210',
        lease_start: '2024-01-01',
        lease_end: '2025-12-31',
        floor_plan: '4A-401 to 4A-410',
        employees: 25,
        parking_slots: 3
      };
    },
  });

  // Get tenant announcements
  const { data: announcements } = useQuery({
    queryKey: ['tenant-announcements'],
    queryFn: async () => {
      // Mock announcements data
      return [
        {
          id: '1',
          title: 'Building Maintenance Schedule',
          content: 'Scheduled maintenance for elevators on Saturday 9 AM - 12 PM',
          priority: 'high',
          created_at: new Date().toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'New Cafeteria Menu',
          content: 'Check out our expanded menu with healthy options',
          priority: 'medium',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          read: true
        }
      ];
    },
  });

  // Get tenant service requests
  const { data: serviceRequests } = useQuery({
    queryKey: ['tenant-requests'],
    queryFn: async () => {
      // Mock service requests data
      return [
        {
          id: '1',
          title: 'AC Repair in Conference Room',
          description: 'Air conditioning unit not working properly',
          status: 'in_progress',
          priority: 'high',
          created_at: new Date().toISOString(),
          assigned_to: 'Maintenance Team'
        },
        {
          id: '2',
          title: 'Additional Parking Request',
          description: 'Need one more parking slot for new employee',
          status: 'pending',
          priority: 'medium',
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ];
    },
  });

  const handleSubmitRequest = () => {
    if (!newRequest.title || !newRequest.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Request Submitted",
      description: "Your service request has been submitted successfully",
    });

    setNewRequest({ title: '', description: '', priority: 'medium' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 border-red-500';
      case 'medium': return 'text-yellow-500 border-yellow-500';
      case 'low': return 'text-green-500 border-green-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  if (!tenantInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Tenant Access Required</h2>
            <p className="text-muted-foreground">
              Please contact building management to set up your tenant profile.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Tenant Portal</h1>
              <p className="text-muted-foreground">{tenantInfo.name} • {tenantInfo.unit}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
                <Badge variant="destructive" className="ml-2">2</Badge>
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Unit Info</span>
                  </div>
                  <div className="text-2xl font-bold">{tenantInfo.unit}</div>
                  <p className="text-xs text-muted-foreground">{tenantInfo.floor_plan}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Lease Period</span>
                  </div>
                  <div className="text-lg font-bold">Active</div>
                  <p className="text-xs text-muted-foreground">Until Dec 2025</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Parking</span>
                  </div>
                  <div className="text-2xl font-bold">{tenantInfo.parking_slots}</div>
                  <p className="text-xs text-muted-foreground">Allocated slots</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Open Requests</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {serviceRequests?.filter(req => req.status !== 'completed').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Active requests</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Announcements */}
            <Card>
              <CardHeader>
                <CardTitle>Building Announcements</CardTitle>
                <CardDescription>Latest updates from building management</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {announcements?.slice(0, 3).map((announcement) => (
                    <div key={announcement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        announcement.priority === 'high' ? 'bg-red-500' : 
                        announcement.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <p className="text-sm text-muted-foreground">{announcement.content}</p>
                      </div>
                      {!announcement.read && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('services')}>
                    <Plus className="w-6 h-6" />
                    <span className="text-sm">New Request</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('bookings')}>
                    <Calendar className="w-6 h-6" />
                    <span className="text-sm">Book Room</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Coffee className="w-6 h-6" />
                    <span className="text-sm">Order Food</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col gap-2">
                    <Shield className="w-6 h-6" />
                    <span className="text-sm">Emergency</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* New Service Request */}
              <Card>
                <CardHeader>
                  <CardTitle>Submit New Request</CardTitle>
                  <CardDescription>Report issues or request services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Request Title</label>
                    <Input
                      value={newRequest.title}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Brief description of your request"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newRequest.description}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the issue or request"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <select
                      className="w-full p-2 border rounded-md bg-background"
                      value={newRequest.priority}
                      onChange={(e) => setNewRequest(prev => ({ ...prev, priority: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <Button onClick={handleSubmitRequest} className="w-full">
                    Submit Request
                  </Button>
                </CardContent>
              </Card>

              {/* Service Request History */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Requests</CardTitle>
                  <CardDescription>Track the status of your service requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {serviceRequests?.map((request) => (
                      <div key={request.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{request.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(request.status)}>
                              {request.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(request.priority)}>
                              {request.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                        {request.assigned_to && (
                          <p className="text-xs text-muted-foreground">Assigned to: {request.assigned_to}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Room Bookings</CardTitle>
                <CardDescription>Book meeting rooms and common areas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Meeting Room Booking</h3>
                  <p className="text-muted-foreground mb-4">
                    Book conference rooms, meeting spaces, and common areas
                  </p>
                  <Button>Book a Room</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Building Communication</CardTitle>
                <CardDescription>Stay connected with building management and other tenants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements?.map((announcement) => (
                    <div key={announcement.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <Badge variant={announcement.priority === 'high' ? 'destructive' : 'secondary'}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{announcement.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>Your tenant information and lease details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Company Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-muted-foreground" />
                        <span>{tenantInfo.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{tenantInfo.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{tenantInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{tenantInfo.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Lease Details</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-muted-foreground">Lease Period</label>
                        <p>{tenantInfo.lease_start} to {tenantInfo.lease_end}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Floor Plan</label>
                        <p>{tenantInfo.floor_plan}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Employee Count</label>
                        <p>{tenantInfo.employees} employees</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Parking Allocation</label>
                        <p>{tenantInfo.parking_slots} slots</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Building Amenities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-green-500" />
                      <span className="text-sm">High-Speed WiFi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Cafeteria</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Parking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-sm">24/7 Security</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TenantsPage;