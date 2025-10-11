import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedMaintenanceAnalytics } from '@/components/analytics/EnhancedMaintenanceAnalytics';
import { ComprehensiveReportGenerator } from '@/components/reports/ComprehensiveReportGenerator';
import { BarChart3, FileText } from 'lucide-react';

export default function EnhancedAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Enhanced Analytics & Reports</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive analytics with advanced metrics, custom date ranges, and automated reporting
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics Dashboard
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Report Generator
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <EnhancedMaintenanceAnalytics />
          </TabsContent>

          <TabsContent value="reports">
            <ComprehensiveReportGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}