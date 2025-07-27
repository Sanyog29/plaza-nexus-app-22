import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Shield, 
  Users, 
  Eye, 
  EyeOff, 
  Info,
  AlertCircle,
  Lock
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { toast } from '@/hooks/use-toast';

interface RoleFeatureConfig {
  [role: string]: {
    [feature: string]: boolean;
  };
}

const FEATURE_DESCRIPTIONS = {
  csvImportEnabled: 'Import data from CSV files',
  dataExportEnabled: 'Export system data to various formats',
  googleSheetsEnabled: 'Integration with Google Sheets',
  forecastingEnabled: 'Predictive analytics and forecasting',
  anomalyDetectionEnabled: 'Automated anomaly detection',
  advancedDashboardsEnabled: 'Access to advanced dashboard features',
  realTimeUpdatesEnabled: 'Real-time data updates and notifications',
  mobileAccessEnabled: 'Mobile application access',
  bulkOperationsEnabled: 'Perform operations on multiple records',
  advancedFiltersEnabled: 'Advanced filtering and search capabilities',
  emailProcessingEnabled: 'Automated email processing features',
  autoReportingEnabled: 'Automated report generation',
  dataValidationEnabled: 'Data validation and quality checks',
};

const ROLE_DISPLAY_NAMES = {
  admin: 'Administrator',
  ops_supervisor: 'Operations Supervisor',
  field_staff: 'Field Staff',
  tenant_manager: 'Tenant Manager',
  vendor: 'Vendor Partner',
};

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  ops_supervisor: 'bg-blue-100 text-blue-800 border-blue-200',
  field_staff: 'bg-green-100 text-green-800 border-green-200',
  tenant_manager: 'bg-purple-100 text-purple-800 border-purple-200',
  vendor: 'bg-orange-100 text-orange-800 border-orange-200',
};

export const RoleFeatureMatrix: React.FC = () => {
  const { isAdmin } = useAuth();
  const { config, updateConfig, saveSection } = useSystemSettings();
  const [roleFeatures, setRoleFeatures] = useState<RoleFeatureConfig>({});
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize default role-feature matrix
  useEffect(() => {
    const defaultConfig: RoleFeatureConfig = {
      admin: { ...config.features },
      ops_supervisor: {
        csvImportEnabled: true,
        dataExportEnabled: true,
        googleSheetsEnabled: false,
        forecastingEnabled: true,
        anomalyDetectionEnabled: false,
        advancedDashboardsEnabled: true,
        realTimeUpdatesEnabled: true,
        mobileAccessEnabled: true,
        bulkOperationsEnabled: true,
        advancedFiltersEnabled: true,
        emailProcessingEnabled: false,
        autoReportingEnabled: true,
        dataValidationEnabled: true,
      },
      field_staff: {
        csvImportEnabled: false,
        dataExportEnabled: false,
        googleSheetsEnabled: false,
        forecastingEnabled: false,
        anomalyDetectionEnabled: false,
        advancedDashboardsEnabled: false,
        realTimeUpdatesEnabled: true,
        mobileAccessEnabled: true,
        bulkOperationsEnabled: false,
        advancedFiltersEnabled: false,
        emailProcessingEnabled: false,
        autoReportingEnabled: false,
        dataValidationEnabled: true,
      },
      tenant_manager: {
        csvImportEnabled: false,
        dataExportEnabled: true,
        googleSheetsEnabled: false,
        forecastingEnabled: false,
        anomalyDetectionEnabled: false,
        advancedDashboardsEnabled: false,
        realTimeUpdatesEnabled: false,
        mobileAccessEnabled: true,
        bulkOperationsEnabled: false,
        advancedFiltersEnabled: true,
        emailProcessingEnabled: false,
        autoReportingEnabled: false,
        dataValidationEnabled: false,
      },
      vendor: {
        csvImportEnabled: false,
        dataExportEnabled: false,
        googleSheetsEnabled: false,
        forecastingEnabled: false,
        anomalyDetectionEnabled: false,
        advancedDashboardsEnabled: false,
        realTimeUpdatesEnabled: false,
        mobileAccessEnabled: true,
        bulkOperationsEnabled: false,
        advancedFiltersEnabled: false,
        emailProcessingEnabled: false,
        autoReportingEnabled: false,
        dataValidationEnabled: false,
      },
    };
    setRoleFeatures(defaultConfig);
  }, [config.features]);

  const handleFeatureToggle = (role: string, feature: string, enabled: boolean) => {
    setRoleFeatures(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [feature]: enabled
      }
    }));
  };

  const handleSaveRoleConfig = async () => {
    setIsLoading(true);
    try {
      // Here you would typically save to your backend
      // For now, we'll use a toast to indicate success
      toast({
        title: "Success",
        description: "Role feature configurations saved successfully.",
      });
      setShowEditor(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save role configurations.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureCount = (role: string) => {
    const features = roleFeatures[role] || {};
    return Object.values(features).filter(Boolean).length;
  };

  if (!isAdmin) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground">
              You need administrator privileges to manage role-based feature access.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Feature Access Control</h2>
          <p className="text-muted-foreground">
            Configure which features are available to each user role
          </p>
        </div>
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogTrigger asChild>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Edit Access Rules
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Role Feature Access Editor</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role to configure" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(roleFeatures).map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedRole && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg">
                    <Info className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">
                        Configuring features for {ROLE_DISPLAY_NAMES[selectedRole as keyof typeof ROLE_DISPLAY_NAMES]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Features will only be available if both the global feature flag and role permission are enabled.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    {Object.entries(roleFeatures[selectedRole] || {}).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            {feature.replace('Enabled', '').replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {FEATURE_DESCRIPTIONS[feature as keyof typeof FEATURE_DESCRIPTIONS]}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {!config.features[feature as keyof typeof config.features] && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Globally Disabled
                            </Badge>
                          )}
                          <Switch
                            checked={enabled}
                            onCheckedChange={(checked) => handleFeatureToggle(selectedRole, feature, checked)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowEditor(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveRoleConfig} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(roleFeatures).map(([role, features]) => (
          <Card key={role} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role}
                </CardTitle>
                <Badge className={ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'bg-gray-100 text-gray-800'}>
                  {getFeatureCount(role)} features
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(features).slice(0, 4).map(([feature, enabled]) => (
                  <div key={feature} className="flex items-center justify-between text-sm">
                    <span className="truncate">
                      {feature.replace('Enabled', '').replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    {enabled ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
                {Object.keys(features).length > 4 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    +{Object.keys(features).length - 4} more features...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Matrix Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Feature Access Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Feature</TableHead>
                  {Object.keys(roleFeatures).map((role) => (
                    <TableHead key={role} className="text-center min-w-[120px]">
                      <Badge className={ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'bg-gray-100 text-gray-800'}>
                        {ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES] || role}
                      </Badge>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(FEATURE_DESCRIPTIONS).map((feature) => (
                  <TableRow key={feature}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{feature.replace('Enabled', '').replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-xs text-muted-foreground">
                          {FEATURE_DESCRIPTIONS[feature as keyof typeof FEATURE_DESCRIPTIONS]}
                        </div>
                      </div>
                    </TableCell>
                    {Object.keys(roleFeatures).map((role) => (
                      <TableCell key={role} className="text-center">
                        {roleFeatures[role]?.[feature] ? (
                          <Badge className="bg-green-100 text-green-800">
                            <Eye className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};