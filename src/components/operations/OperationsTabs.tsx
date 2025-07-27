import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { UnifiedDataExportTools } from './UnifiedDataExportTools';
import { EnhancedRealTimeAnalytics } from './EnhancedRealTimeAnalytics';
import { PredictiveMaintenanceScheduler } from './PredictiveMaintenanceScheduler';
import { CostOptimizationRecommendations } from './CostOptimizationRecommendations';
import { AdvancedWorkflowBuilder } from './AdvancedWorkflowBuilder';
import { IntelligentCommandCenter } from './IntelligentCommandCenter';
import { MLIntegrationLayer } from './MLIntegrationLayer';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { BarChart3, Database, Brain, Wrench, TrendingDown, AlertCircle, Command, Cpu, FileText, Users, Zap, DollarSign } from 'lucide-react';
import { AIStaffScheduling } from './AIStaffScheduling';
import { PredictiveMaintenance } from './PredictiveMaintenance';
import { EnergyManagement } from './EnergyManagement';
import { FinancialAnalytics } from './FinancialAnalytics';

interface OperationsTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  canUseAdvancedDashboards: boolean;
  canImportCSV: boolean;
  canExportData: boolean;
  canForecast: boolean;
}

export const OperationsTabs: React.FC<OperationsTabsProps> = ({
  activeTab,
  onTabChange,
  canUseAdvancedDashboards,
  canImportCSV,
  canExportData,
  canForecast
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
      <TabsList className="grid w-full grid-cols-6 md:grid-cols-12 bg-card/50 text-xs">
        <TabsTrigger value="analytics" className="flex items-center gap-1 px-2">
          <BarChart3 className="h-3 w-3" />
          Analytics
        </TabsTrigger>
        <TabsTrigger value="staff-scheduling" className="flex items-center gap-1 px-2">
          <Users className="h-3 w-3" />
          AI Staff
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="flex items-center gap-1 px-2">
          <Wrench className="h-3 w-3" />
          Predictive
        </TabsTrigger>
        <TabsTrigger value="energy" className="flex items-center gap-1 px-2">
          <Zap className="h-3 w-3" />
          Energy
        </TabsTrigger>
        <TabsTrigger value="financial" className="flex items-center gap-1 px-2">
          <DollarSign className="h-3 w-3" />
          Financial
        </TabsTrigger>
        <TabsTrigger value="data" className="flex items-center gap-1 px-2">
          <Database className="h-3 w-3" />
          Data
        </TabsTrigger>
        <TabsTrigger value="advanced" className="flex items-center gap-1 px-2">
          <Brain className="h-3 w-3" />
          Real-time
        </TabsTrigger>
        <TabsTrigger value="cost-optimization" className="flex items-center gap-1 px-2">
          <TrendingDown className="h-3 w-3" />
          Cost
        </TabsTrigger>
        <TabsTrigger value="workflows" className="flex items-center gap-1 px-2">
          <Command className="h-3 w-3" />
          Workflows
        </TabsTrigger>
        <TabsTrigger value="command" className="flex items-center gap-1 px-2">
          <Command className="h-3 w-3" />
          Command
        </TabsTrigger>
        <TabsTrigger value="ml" className="flex items-center gap-1 px-2">
          <Cpu className="h-3 w-3" />
          ML
        </TabsTrigger>
        <TabsTrigger value="executive" className="flex items-center gap-1 px-2">
          <FileText className="h-3 w-3" />
          Executive
        </TabsTrigger>
      </TabsList>

      <TabsContent value="analytics" className="space-y-6">
        {canUseAdvancedDashboards ? (
          <AnalyticsDashboard />
        ) : (
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Feature Disabled</h3>
              <p className="text-muted-foreground">
                Advanced dashboards are currently disabled. Contact your administrator to enable this feature.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="staff-scheduling" className="space-y-6">
        <AIStaffScheduling />
      </TabsContent>

      <TabsContent value="maintenance" className="space-y-6">
        <PredictiveMaintenance />
      </TabsContent>

      <TabsContent value="energy" className="space-y-6">
        <EnergyManagement />
      </TabsContent>

      <TabsContent value="financial" className="space-y-6">
        <FinancialAnalytics />
      </TabsContent>

      <TabsContent value="data" className="space-y-6">
        {(canImportCSV || canExportData) ? (
          <UnifiedDataExportTools enableRealtime={canExportData} />
        ) : (
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Feature Disabled</h3>
              <p className="text-muted-foreground">
                Data import/export features are currently disabled. Contact your administrator to enable these features.
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  CSV Import: {canImportCSV ? '✅ Enabled' : '❌ Disabled'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Data Export: {canExportData ? '✅ Enabled' : '❌ Disabled'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="advanced" className="space-y-6">
        {canUseAdvancedDashboards ? (
          <div className="space-y-6">
            {!canForecast && (
              <Card className="bg-yellow-500/10 border-yellow-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <p className="text-sm font-medium">Limited Features</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Some advanced analytics features like forecasting and anomaly detection are disabled. 
                    Enable them in the system configuration to unlock full capabilities.
                  </p>
                </CardContent>
              </Card>
            )}
            <EnhancedRealTimeAnalytics />
          </div>
        ) : (
          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Feature Disabled</h3>
              <p className="text-muted-foreground">
                Advanced analytics features are currently disabled. Contact your administrator to enable this feature.
              </p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="predictive" className="space-y-6">
        <PredictiveMaintenanceScheduler />
      </TabsContent>

      <TabsContent value="cost-optimization" className="space-y-6">
        <CostOptimizationRecommendations />
      </TabsContent>

      <TabsContent value="workflows" className="space-y-6">
        <AdvancedWorkflowBuilder />
      </TabsContent>

      <TabsContent value="command" className="space-y-6">
        <IntelligentCommandCenter />
      </TabsContent>

      <TabsContent value="ml" className="space-y-6">
        <MLIntegrationLayer />
      </TabsContent>

      <TabsContent value="executive" className="space-y-6">
        <ExecutiveDashboard />
      </TabsContent>
    </Tabs>
  );
};