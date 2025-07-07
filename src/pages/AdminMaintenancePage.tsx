import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Wrench, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';

const AdminMaintenancePage = () => {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Maintenance Management</h1>
          <p className="text-muted-foreground">Overview and management of all maintenance operations</p>
        </div>
        <Button>
          <Wrench className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 from yesterday</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">8 available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">+2% this week</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹45,000</div>
            <p className="text-xs text-muted-foreground">68% utilized</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">All Requests</TabsTrigger>
          <TabsTrigger value="assets">Asset Management</TabsTrigger>
          <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Requests</CardTitle>
                <CardDescription>Latest maintenance requests requiring attention</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: 'MR-001', title: 'AC Unit Repair - Floor 3', priority: 'High', status: 'In Progress' },
                  { id: 'MR-002', title: 'Elevator Maintenance', priority: 'Medium', status: 'Pending' },
                  { id: 'MR-003', title: 'Plumbing Issue - Restroom B2', priority: 'Urgent', status: 'Assigned' },
                ].map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{request.title}</p>
                      <p className="text-sm text-muted-foreground">{request.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={request.priority === 'Urgent' ? 'destructive' : request.priority === 'High' ? 'secondary' : 'outline'}>
                        {request.priority}
                      </Badge>
                      <Badge variant="outline">{request.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Status</CardTitle>
                <CardDescription>Current status of major building assets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'HVAC Systems', status: 'Operational', lastService: '2 days ago' },
                  { name: 'Elevators', status: 'Maintenance Due', lastService: '1 week ago' },
                  { name: 'Fire Safety', status: 'Operational', lastService: '3 days ago' },
                  { name: 'Electrical', status: 'Operational', lastService: '1 day ago' },
                ].map((asset) => (
                  <div key={asset.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-muted-foreground">Last service: {asset.lastService}</p>
                    </div>
                    <Badge variant={asset.status === 'Operational' ? 'secondary' : 'outline'}>
                      {asset.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>All Maintenance Requests</CardTitle>
              <CardDescription>Complete list of maintenance requests with filters and actions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Maintenance requests table would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Asset Management</CardTitle>
              <CardDescription>Manage building assets, schedules, and maintenance records</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Asset management interface would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Staff Assignment</CardTitle>
              <CardDescription>Assign maintenance tasks to staff members and track progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Staff assignment interface would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Analytics</CardTitle>
              <CardDescription>Performance metrics and insights for maintenance operations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Analytics dashboard would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminMaintenancePage;