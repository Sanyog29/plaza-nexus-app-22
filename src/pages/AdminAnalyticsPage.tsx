import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VisitorAnalytics } from '@/components/analytics/VisitorAnalytics';
import { SecurityAnalytics } from '@/components/analytics/SecurityAnalytics';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics';
import { useAuth } from '@/components/AuthProvider';
import { Navigate } from 'react-router-dom';

const AdminAnalyticsPage = () => {
  const { isAdmin } = useAuth();
  const [selectedTab, setSelectedTab] = useState('visitor');

  // Redirect non-admin users
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics & Reports Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive analytics for visitor management and security operations</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-card/50">
          <TabsTrigger value="visitor">Visitor Analytics</TabsTrigger>
          <TabsTrigger value="security">Security Analytics</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="reports">Report Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="visitor" className="mt-6">
          <VisitorAnalytics />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityAnalytics />
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