import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Building, Calendar, Users, Star, Clock, CheckCircle } from 'lucide-react';

const StaffServicesPage = () => {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Service Delivery</h1>
          <p className="text-muted-foreground">Manage service assignments and customer interactions</p>
        </div>
        <Button>
          <CheckCircle className="mr-2 h-4 w-4" />
          Complete Service
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Services</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">6 scheduled today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">2 meeting rooms, 1 cleaning</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">100% on time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.9</div>
            <p className="text-xs text-muted-foreground">Excellent performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned">Assigned Services</TabsTrigger>
          <TabsTrigger value="inprogress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="schedule">Today's Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <div className="grid gap-4">
            {[
              { id: 'SV-001', title: 'Conference Room Setup - Room A', client: 'Tech Corp', type: 'Meeting Room', time: '2:00 PM - 4:00 PM', status: 'Scheduled' },
              { id: 'SV-002', title: 'Office Cleaning - Floor 5', client: 'Marketing Inc', type: 'Cleaning', time: '5:00 PM - 7:00 PM', status: 'Scheduled' },
              { id: 'SV-003', title: 'Catering Service - Meeting Room B', client: 'Design Studio', type: 'Catering', time: '12:00 PM - 1:00 PM', status: 'Ready to Start' },
            ].map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <CardDescription>{service.id} • {service.client} • {service.type}</CardDescription>
                    </div>
                    <Badge variant={service.status === 'Ready to Start' ? 'secondary' : 'outline'}>
                      {service.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {service.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {service.client}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button size="sm">Start Service</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inprogress">
          <Card>
            <CardHeader>
              <CardTitle>Services In Progress</CardTitle>
              <CardDescription>Currently active service deliveries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'IT Support - Floor 3', client: 'Finance Dept', startedAt: '1:30 PM', estimatedEnd: '2:30 PM' },
                { title: 'Room Preparation - Conference A', client: 'HR Team', startedAt: '2:00 PM', estimatedEnd: '2:45 PM' },
              ].map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{service.title}</p>
                    <p className="text-sm text-muted-foreground">{service.client} • Started: {service.startedAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Est. completion: {service.estimatedEnd}</span>
                    <Button variant="outline" size="sm">Update Status</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Services</CardTitle>
              <CardDescription>Recently completed service deliveries</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your completed services history would be displayed here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your complete service schedule for today</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your daily schedule would be displayed here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffServicesPage;