import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricsOverview } from './MetricsOverview';
import { PerformanceCharts } from './PerformanceCharts';
import { SystemHealth } from './SystemHealth';
import { ReportsGenerator } from './ReportsGenerator';

export const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Monitor system performance and generate insights
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <MetricsOverview />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceCharts />
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <SystemHealth />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <ReportsGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
};