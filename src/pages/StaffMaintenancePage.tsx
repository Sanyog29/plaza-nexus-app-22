import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Wrench, CheckCircle, AlertTriangle, User, Calendar } from 'lucide-react';

const StaffMaintenancePage = () => {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Maintenance Tasks</h1>
          <p className="text-muted-foreground">Manage your assigned maintenance tasks and work orders</p>
        </div>
        <Button>
          <CheckCircle className="mr-2 h-4 w-4" />
          Complete Task
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 high priority</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Started today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">+2 from yesterday</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="assigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assigned">Assigned Tasks</TabsTrigger>
          <TabsTrigger value="inprogress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="schedule">My Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="space-y-4">
          <div className="grid gap-4">
            {[
              { id: 'MT-001', title: 'Replace HVAC Filter - Floor 5', priority: 'High', location: 'Building A - Floor 5', estimatedTime: '2 hours', dueDate: 'Today, 4:00 PM' },
              { id: 'MT-002', title: 'Fix Leaking Faucet - Restroom B3', priority: 'Medium', location: 'Building B - Floor 3', estimatedTime: '45 mins', dueDate: 'Tomorrow, 10:00 AM' },
              { id: 'MT-003', title: 'Elevator Inspection', priority: 'High', location: 'Building A - Elevator 2', estimatedTime: '3 hours', dueDate: 'Today, 2:00 PM' },
            ].map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <CardDescription>{task.id} • {task.location}</CardDescription>
                    </div>
                    <Badge variant={task.priority === 'High' ? 'destructive' : 'secondary'}>
                      {task.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {task.estimatedTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {task.dueDate}
                      </div>
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

        <TabsContent value="inprogress">
          <Card>
            <CardHeader>
              <CardTitle>Tasks In Progress</CardTitle>
              <CardDescription>Currently active maintenance tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your in-progress tasks would be displayed here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Tasks</CardTitle>
              <CardDescription>Recently completed maintenance work</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your completed tasks history would be displayed here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>My Schedule</CardTitle>
              <CardDescription>Your maintenance schedule and upcoming assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Your work schedule would be displayed here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffMaintenancePage;