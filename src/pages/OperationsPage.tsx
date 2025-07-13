import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AnalyticsDashboard } from '@/components/operations/AnalyticsDashboard';
import { DataExportTools } from '@/components/operations/DataExportTools';
import { EnhancedAnalytics } from '@/components/operations/EnhancedAnalytics';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useAuth } from '@/components/AuthProvider';
import { 
  BarChart3, 
  Database, 
  TrendingUp, 
  Brain,
  FileText,
  Shield,
  AlertCircle
} from 'lucide-react';

const OperationsPage: React.FC = () => {
  const { isAdmin, isStaff } = useAuth();
  const { canUseAdvancedDashboards, canImportCSV, canExportData, canForecast } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState('analytics');

  if (!isStaff && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Access Denied</h3>
            <p className="text-muted-foreground">Operations panel requires staff privileges.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Operations Center
          </h1>
          <p className="text-muted-foreground">
            Comprehensive facility management and analytics platform
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          )}
          <Badge variant="secondary" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Staff
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
            <DataExportTools />
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
              <EnhancedAnalytics />
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

      {/* Feature Status Overview */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Feature Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">CSV Import</span>
              <Badge variant={canImportCSV ? 'default' : 'secondary'}>
                {canImportCSV ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Data Export</span>
              <Badge variant={canExportData ? 'default' : 'secondary'}>
                {canExportData ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">Dashboards</span>
              <Badge variant={canUseAdvancedDashboards ? 'default' : 'secondary'}>
                {canUseAdvancedDashboards ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium">AI Forecast</span>
              <Badge variant={canForecast ? 'default' : 'secondary'}>
                {canForecast ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperationsPage;