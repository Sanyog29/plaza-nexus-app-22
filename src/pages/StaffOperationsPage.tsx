import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckSquare } from 'lucide-react';
import { StaffAttendanceSystem } from '@/components/operations/StaffAttendanceSystem';
import { DailyChecklistSystem } from '@/components/operations/DailyChecklistSystem';

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
          <TabsList className="grid w-full grid-cols-2 bg-card/50">
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="checklists" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Daily Checklists
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <StaffAttendanceSystem />
          </TabsContent>

          <TabsContent value="checklists">
            <DailyChecklistSystem />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffOperationsPage;