import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Users, Target, TrendingUp, Zap, BookOpen } from 'lucide-react';
import { StaffPerformanceAnalytics } from '@/components/staff/StaffPerformanceAnalytics';
import { AITaskDistribution } from '@/components/staff/AITaskDistribution';
import { StaffTrainingModule } from '@/components/staff/StaffTrainingModule';
import { MaintenanceForecasting } from '@/components/predictive/MaintenanceForecasting';
import { useAuth } from '@/components/AuthProvider';

const OperationalExcellencePage: React.FC = () => {
  const { isAdmin, userRole } = useAuth();

  if (!isAdmin && userRole !== 'ops_supervisor') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="text-center py-12">
            <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">Operational Excellence dashboard requires supervisor access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            Operational Excellence & Intelligence
          </h1>
          <p className="text-muted-foreground">
            AI-powered staff management, predictive analytics, and intelligent automation
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-card/50">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">AI Distribution</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Training</span>
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Forecasting</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <StaffPerformanceAnalytics />
          </TabsContent>

          <TabsContent value="distribution">
            <AITaskDistribution />
          </TabsContent>

          <TabsContent value="training">
            <StaffTrainingModule />
          </TabsContent>

          <TabsContent value="forecasting">
            <MaintenanceForecasting />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OperationalExcellencePage;