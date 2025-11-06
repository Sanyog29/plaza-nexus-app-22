
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTabTransition } from '@/hooks/useTransitionState';
import PerformanceCharts from './PerformanceCharts';
import { MetricsOverview } from './MetricsOverview';
import { AnalyticsLoadingSkeleton } from './AnalyticsLoadingSkeleton';
import { EmptyAnalyticsState } from './EmptyAnalyticsState';

const AnalyticsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useTabTransition('overview');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into system performance and operations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MetricsOverview />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceCharts />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis</CardTitle>
              <CardDescription>
                Historical trends and predictive analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Trend analysis coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
