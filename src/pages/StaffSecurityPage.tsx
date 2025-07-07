import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Camera, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

const StaffSecurityPage = () => {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Operations</h1>
          <p className="text-muted-foreground">Manage security tasks, visitor assistance, and incident reports</p>
        </div>
        <Button>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Report Incident
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Shift</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6h 30m</div>
            <p className="text-xs text-muted-foreground">Started at 8:00 AM</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitors Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">5 pending approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Rounds</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4/6</div>
            <p className="text-xs text-muted-foreground">Completed today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Resolved today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Security Tasks</TabsTrigger>
          <TabsTrigger value="visitors">Visitor Management</TabsTrigger>
          <TabsTrigger value="incidents">Incident Reports</TabsTrigger>
          <TabsTrigger value="rounds">Security Rounds</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4">
            {[
              { id: 'ST-001', title: 'Visitor Badge Check - Main Entrance', status: 'Pending', priority: 'High', time: '2:30 PM' },
              { id: 'ST-002', title: 'CCTV System Check - Floor 3', status: 'In Progress', priority: 'Medium', time: '3:00 PM' },
              { id: 'ST-003', title: 'Parking Area Patrol', status: 'Scheduled', priority: 'Low', time: '4:00 PM' },
            ].map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <CardDescription>{task.id} • Scheduled for {task.time}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={task.priority === 'High' ? 'destructive' : task.priority === 'Medium' ? 'secondary' : 'outline'}>
                        {task.priority}
                      </Badge>
                      <Badge variant="outline">{task.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{task.time}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View Details</Button>
                      <Button size="sm">Start Task</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="visitors">
          <Card>
            <CardHeader>
              <CardTitle>Visitor Management</CardTitle>
              <CardDescription>Assist visitors and manage access requests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'John Smith', company: 'ABC Corp', purpose: 'Meeting', status: 'Waiting for approval', time: '2:15 PM' },
                { name: 'Sarah Johnson', company: 'XYZ Ltd', purpose: 'Delivery', status: 'Approved', time: '2:30 PM' },
                { name: 'Mike Wilson', company: 'Tech Solutions', purpose: 'Maintenance', status: 'In building', time: '1:45 PM' },
              ].map((visitor, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{visitor.name}</p>
                    <p className="text-sm text-muted-foreground">{visitor.company} • {visitor.purpose} • {visitor.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={visitor.status === 'Approved' ? 'secondary' : visitor.status === 'In building' ? 'outline' : 'destructive'}>
                      {visitor.status}
                    </Badge>
                    <Button variant="outline" size="sm">Assist</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Incident Reports</CardTitle>
              <CardDescription>File and track security incidents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Incident reporting interface would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rounds">
          <Card>
            <CardHeader>
              <CardTitle>Security Rounds</CardTitle>
              <CardDescription>Scheduled security checks and patrol routes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Security rounds tracking would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffSecurityPage;