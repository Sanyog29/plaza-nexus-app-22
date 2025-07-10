import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisitorAnalytics } from '@/components/analytics/VisitorAnalytics';
import { SecurityAnalytics } from '@/components/analytics/SecurityAnalytics';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics';
import SystemHealthDashboard from '@/components/admin/SystemHealthDashboard';
import { useAuth } from '@/components/AuthProvider';
import { Navigate } from 'react-router-dom';

const AdminAnalyticsPage = () => {
  const { isAdmin } = useAuth();
  const [selectedTab, setSelectedTab] = useState('health');

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">System Analytics & Health Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive monitoring for system health, performance, and operational excellence</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-card/50">
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="visitor">Visitor Analytics</TabsTrigger>
          <TabsTrigger value="security">Security Analytics</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="reports">Report Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-6">
          <SystemHealthDashboard />
        </TabsContent>

        <TabsContent value="visitor" className="mt-6">
          <VisitorAnalytics period="30" />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityAnalytics period="30" />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <AdvancedAnalytics />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <ReportGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalyticsPage;