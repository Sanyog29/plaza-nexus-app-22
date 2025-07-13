import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { UnifiedDataExportTools } from './UnifiedDataExportTools';
import { EnhancedRealTimeAnalytics } from './EnhancedRealTimeAnalytics';
import { BarChart3, Database, Brain, AlertCircle } from 'lucide-react';

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
      <TabsList className="grid w-full grid-cols-3 bg-card/50">
        <TabsTrigger value="analytics" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Analytics Dashboard
        </TabsTrigger>
        <TabsTrigger value="data" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          Data Management
          {(!canImportCSV || !canExportData) && (
            <AlertCircle className="h-3 w-3 text-yellow-500" />
          )}
        </TabsTrigger>
        <TabsTrigger value="advanced" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Advanced Analytics
          {!canUseAdvancedDashboards && (
            <AlertCircle className="h-3 w-3 text-red-500" />
          )}
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
    </Tabs>
  );
};