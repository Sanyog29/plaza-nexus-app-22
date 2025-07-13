import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface FeatureStatusOverviewProps {
  canImportCSV: boolean;
  canExportData: boolean;
  canUseAdvancedDashboards: boolean;
  canForecast: boolean;
}

export const FeatureStatusOverview: React.FC<FeatureStatusOverviewProps> = ({
  canImportCSV,
  canExportData,
  canUseAdvancedDashboards,
  canForecast
}) => {
  return (
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
  );
};