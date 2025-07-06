import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SLADashboard } from '@/components/sla/SLADashboard';
import { UnifiedRequestsList } from '@/components/unified/UnifiedRequestsList';
import { UnifiedRequest } from '@/hooks/useUnifiedRequests';
import { useAuth } from '@/components/AuthProvider';
import { BarChart3, Clock, Users, AlertCircle } from 'lucide-react';

export default function UnifiedDashboardPage() {
  const { isStaff, isAdmin, userRole } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);

  const handleViewRequest = (request: UnifiedRequest) => {
    setSelectedRequest(request);
    // In a real app, this would navigate to request details or open a modal
    console.log('View request:', request);
  };

  const handleCreateRequest = () => {
    // In a real app, this would navigate to create request page or open a modal
    console.log('Create new request');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white">
            {isAdmin ? 'Admin Dashboard' : isStaff ? 'Operations Dashboard' : 'Service Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? 'Complete system overview with SLA monitoring and analytics'
              : isStaff 
              ? 'Manage requests and monitor service levels'
              : 'Submit and track your service requests'
            }
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Role</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white capitalize">
                {userRole?.replace('_', ' ') || 'User'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Access Level</CardTitle>
              <AlertCircle className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {isAdmin ? 'Full' : isStaff ? 'Staff' : 'Limited'}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">System Status</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                Online
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">SLA Engine</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                Active
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 bg-card/50">
            <TabsTrigger value="requests" className="data-[state=active]:bg-primary">
              Service Requests
            </TabsTrigger>
            {isStaff && (
              <TabsTrigger value="sla" className="data-[state=active]:bg-primary">
                SLA Monitoring
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary">
                Analytics
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            <UnifiedRequestsList 
              onViewRequest={handleViewRequest}
              onCreateRequest={handleCreateRequest}
            />
          </TabsContent>

          {isStaff && (
            <TabsContent value="sla" className="space-y-6">
              <SLADashboard />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="analytics" className="space-y-6">
              <Card className="bg-card/50 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-white">Analytics Dashboard</CardTitle>
                  <CardDescription>
                    Advanced analytics and reporting tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Advanced Analytics Coming Soon
                    </h3>
                    <p className="text-muted-foreground">
                      Comprehensive reporting and data visualization tools will be available in Phase 3
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}