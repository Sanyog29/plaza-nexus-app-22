import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckSquare, Wrench, ClipboardList, BarChart3, Zap } from 'lucide-react';
import { StaffAttendanceSystem } from '@/components/operations/StaffAttendanceSystem';
import { DailyChecklistSystem } from '@/components/operations/DailyChecklistSystem';
import { AssetManagementSystem } from '@/components/operations/AssetManagementSystem';
import { SimplifiedTaskSystem } from '@/components/operations/SimplifiedTaskSystem';
import { UtilityManagementSystem } from '@/components/operations/UtilityManagementSystem';
import { AnalyticsDashboard } from '@/components/operations/AnalyticsDashboard';

const StaffOperationsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-plaza-dark p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              Staff Operations Dashboard
            </CardTitle>
            <p className="text-gray-400">
              Manage your daily tasks, attendance, and checklists
            </p>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-card/50">
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="checklists" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Checklists
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="utilities" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Utilities
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <StaffAttendanceSystem />
          </TabsContent>

          <TabsContent value="checklists">
            <DailyChecklistSystem />
          </TabsContent>

          <TabsContent value="assets">
            <AssetManagementSystem />
          </TabsContent>

          <TabsContent value="tasks">
            <SimplifiedTaskSystem />
          </TabsContent>

          <TabsContent value="utilities">
            <UtilityManagementSystem />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffOperationsPage;