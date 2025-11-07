import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcurementStats } from '@/components/procurement/ProcurementStats';
import { MyTasksList } from '@/components/procurement/MyTasksList';
import { QuickActions } from '@/components/procurement/QuickActions';
import { useAuth } from '@/components/AuthProvider';
import { SEOHead } from '@/components/seo/SEOHead';
import { Package, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const ProcurementDashboard = () => {
  const { userRole, permissions } = useAuth();

  return (
    <>
      <SEOHead
        title="Procurement Dashboard"
        description="Manage requisitions, vendors, and purchase orders efficiently."
        url={`${window.location.origin}/procurement`}
        type="website"
        noindex
      />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Procurement Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Streamlined procurement operations for {userRole === 'procurement_manager' ? 'managers' : 'executives'}
            </p>
          </div>
          <QuickActions />
        </div>

        {/* Stats Overview */}
        <ProcurementStats />

        {/* Main Content */}
        <Tabs defaultValue="approved" className="w-full">
          {userRole === 'procurement_manager' ? (
            <>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="approved">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approved Requisitions
                </TabsTrigger>
                <TabsTrigger value="assigned">
                  <Package className="h-4 w-4 mr-2" />
                  In Progress
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Reports
                </TabsTrigger>
              </TabsList>

              <TabsContent value="approved" className="space-y-4">
                <MyTasksList filter="manager_approved" />
              </TabsContent>

              <TabsContent value="assigned" className="space-y-4">
                <MyTasksList filter="all" />
              </TabsContent>
            </>
          ) : (
            <>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="approved">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approved
                </TabsTrigger>
                <TabsTrigger value="assigned">
                  <Package className="h-4 w-4 mr-2" />
                  Assigned
                </TabsTrigger>
                <TabsTrigger value="orders">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Reports
                </TabsTrigger>
              </TabsList>

              <TabsContent value="approved" className="space-y-4">
                <MyTasksList filter="manager_approved" />
              </TabsContent>

              <TabsContent value="assigned" className="space-y-4">
                <MyTasksList filter="all" />
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Orders</CardTitle>
                    <CardDescription>
                      View and manage purchase orders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Purchase order management coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Procurement Reports</CardTitle>
                <CardDescription>
                  View detailed analytics and reports for procurement activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Detailed reporting features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ProcurementDashboard;
