import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { OperationsHeader } from '@/components/operations/OperationsHeader';
import { OperationsTabs } from '@/components/operations/OperationsTabs';
import { FeatureStatusOverview } from '@/components/operations/FeatureStatusOverview';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useAuth } from '@/components/AuthProvider';
import { Shield, AlertCircle } from 'lucide-react';

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
    <div className="w-full space-y-6">
      <OperationsHeader isAdmin={isAdmin} />
      
      <OperationsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        canUseAdvancedDashboards={canUseAdvancedDashboards}
        canImportCSV={canImportCSV}
        canExportData={canExportData}
        canForecast={canForecast}
      />

      <FeatureStatusOverview
        canImportCSV={canImportCSV}
        canExportData={canExportData}
        canUseAdvancedDashboards={canUseAdvancedDashboards}
        canForecast={canForecast}
      />
    </div>
  );
};

export default OperationsPage;