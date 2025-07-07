import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SLADashboard } from '@/components/sla/SLADashboard';
import { UnifiedRequestsList } from '@/components/unified/UnifiedRequestsList';
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics';
import { CostControlSystem } from '@/components/analytics/CostControlSystem';
import { ExecutiveDashboard } from '@/components/analytics/ExecutiveDashboard';
import { UnifiedRequest } from '@/hooks/useUnifiedRequests';
import { useAuth } from '@/components/AuthProvider';
import { BarChart3, Clock, Users, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';

export default function UnifiedDashboardPage() {
  const { isStaff, isAdmin, userRole } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);

  const handleViewRequest = (request: UnifiedRequest) => {
    setSelectedRequest(request);
    // Navigation to request details handled by component
  };

  const handleCreateRequest = () => {
    // Navigation to create request handled by component
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
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-card/50">
            <TabsTrigger value="requests" className="data-[state=active]:bg-primary">
              Requests
            </TabsTrigger>
            {isStaff && (
              <TabsTrigger value="sla" className="data-[state=active]:bg-primary">
                SLA
              </TabsTrigger>
            )}
            {(isAdmin || userRole === 'ops_supervisor') && (
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary">
                Analytics
              </TabsTrigger>
            )}
            {(isAdmin || userRole === 'ops_supervisor') && (
              <TabsTrigger value="costs" className="data-[state=active]:bg-primary">
                Costs
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="executive" className="data-[state=active]:bg-primary">
                Executive
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

          {(isAdmin || userRole === 'ops_supervisor') && (
            <TabsContent value="analytics" className="space-y-6">
              <AdvancedAnalytics />
            </TabsContent>
          )}

          {(isAdmin || userRole === 'ops_supervisor') && (
            <TabsContent value="costs" className="space-y-6">
              <CostControlSystem />
            </TabsContent>
          )}

          {isAdmin && (
            <TabsContent value="executive" className="space-y-6">
              <ExecutiveDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}