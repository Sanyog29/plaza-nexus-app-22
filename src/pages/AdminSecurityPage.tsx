import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, Camera, Key, Clock, AlertTriangle } from 'lucide-react';

const AdminSecurityPage = () => {
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Security Management</h1>
          <p className="text-muted-foreground">Comprehensive security oversight and visitor management</p>
        </div>
        <Button>
          <Shield className="mr-2 h-4 w-4" />
          Security Alert
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">12 pending approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Guards</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">6 on duty</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Points</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">All operational</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents Today</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">1 resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visitors">Visitor Management</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="guards">Security Guards</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Visitor Activity</CardTitle>
                <CardDescription>Latest visitor check-ins and approvals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: 'John Smith', company: 'ABC Corp', status: 'Checked In', time: '10:30 AM' },
                  { name: 'Sarah Johnson', company: 'XYZ Ltd', status: 'Pending Approval', time: '10:15 AM' },
                  { name: 'Mike Wilson', company: 'Tech Solutions', status: 'Checked Out', time: '9:45 AM' },
                ].map((visitor, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{visitor.name}</p>
                      <p className="text-sm text-muted-foreground">{visitor.company} • {visitor.time}</p>
                    </div>
                    <Badge variant={visitor.status === 'Checked In' ? 'secondary' : visitor.status === 'Pending Approval' ? 'outline' : 'destructive'}>
                      {visitor.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Status</CardTitle>
                <CardDescription>Current security system status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { system: 'CCTV Network', status: 'Online', details: '24/24 cameras active' },
                  { system: 'Access Control', status: 'Online', details: 'All readers functional' },
                  { system: 'Fire Safety', status: 'Online', details: 'All sensors active' },
                  { system: 'Intrusion Detection', status: 'Armed', details: 'Perimeter secured' },
                ].map((system, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{system.system}</p>
                      <p className="text-sm text-muted-foreground">{system.details}</p>
                    </div>
                    <Badge variant={system.status === 'Online' || system.status === 'Armed' ? 'secondary' : 'destructive'}>
                      {system.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visitors">
          <Card>
            <CardHeader>
              <CardTitle>Visitor Management</CardTitle>
              <CardDescription>Manage visitor registrations, approvals, and access</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Comprehensive visitor management interface would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Manage access permissions, cards, and entry points</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Access control management interface would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guards">
          <Card>
            <CardHeader>
              <CardTitle>Security Guards</CardTitle>
              <CardDescription>Manage guard schedules, shifts, and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Security guard management interface would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
              <CardDescription>Track and manage security incidents and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Incident management interface would be implemented here...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSecurityPage;