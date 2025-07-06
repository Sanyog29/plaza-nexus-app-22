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
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-card/50 h-auto">
            <TabsTrigger value="attendance" className="flex items-center gap-2 text-xs md:text-sm">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="checklists" className="flex items-center gap-2 text-xs md:text-sm">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Checklists</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2 text-xs md:text-sm">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Assets</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2 text-xs md:text-sm">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="utilities" className="flex items-center gap-2 text-xs md:text-sm">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Utilities</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs md:text-sm">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
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