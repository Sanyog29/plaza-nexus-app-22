import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckSquare, Wrench, ClipboardList, BarChart3, Zap, Users, Award } from 'lucide-react';
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
              Comprehensive facility management and operational excellence tools
            </p>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-8 bg-card/50 h-auto">
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
            <TabsTrigger value="performance" className="flex items-center gap-2 text-xs md:text-sm">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2 text-xs md:text-sm">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Training</span>
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

          <TabsContent value="performance">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Staff Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-primary/10 rounded-lg">
                    <div className="text-3xl font-bold text-green-400 mb-2">94.2%</div>
                    <div className="text-sm text-muted-foreground">Task Completion Rate</div>
                  </div>
                  <div className="text-center p-6 bg-primary/10 rounded-lg">
                    <div className="text-3xl font-bold text-blue-400 mb-2">4.8/5</div>
                    <div className="text-sm text-muted-foreground">Quality Score</div>
                  </div>
                  <div className="text-center p-6 bg-primary/10 rounded-lg">
                    <div className="text-3xl font-bold text-purple-400 mb-2">2.1h</div>
                    <div className="text-sm text-muted-foreground">Avg Response Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Staff Training & Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Available Training Modules</h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-card/30 rounded-lg flex justify-between items-center">
                        <span className="text-white">Safety Protocols</span>
                        <span className="text-green-400 text-sm">Completed</span>
                      </div>
                      <div className="p-3 bg-card/30 rounded-lg flex justify-between items-center">
                        <span className="text-white">Equipment Maintenance</span>
                        <span className="text-yellow-400 text-sm">In Progress</span>
                      </div>
                      <div className="p-3 bg-card/30 rounded-lg flex justify-between items-center">
                        <span className="text-white">Customer Service</span>
                        <span className="text-gray-400 text-sm">Not Started</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Certification Status</h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <div className="font-medium text-green-400">HVAC Certified</div>
                        <div className="text-sm text-muted-foreground">Valid until Dec 2024</div>
                      </div>
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="font-medium text-blue-400">Electrical Safety</div>
                        <div className="text-sm text-muted-foreground">Valid until Mar 2025</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffOperationsPage;