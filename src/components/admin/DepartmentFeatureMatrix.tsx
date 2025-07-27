import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/AuthProvider';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, Settings, Shield, Clock, MapPin, GitBranch } from 'lucide-react';

interface DepartmentFeatureConfig {
  [department: string]: {
    [feature: string]: {
      enabled: boolean;
      override: 'inherit' | 'force_enable' | 'force_disable';
      conditions?: {
        timeRestricted?: boolean;
        locationRestricted?: boolean;
        emergencyOverride?: boolean;
      };
    };
  };
}

const DEPARTMENTS = [
  'maintenance',
  'security', 
  'facilities',
  'administration',
  'finance',
  'sustainability',
  'operations'
];

const FEATURE_DESCRIPTIONS = {
  csvImportEnabled: 'Import data from CSV files',
  dataExportEnabled: 'Export system data to external formats',
  googleSheetsEnabled: 'Integration with Google Sheets',
  forecastingEnabled: 'Predictive analytics and forecasting',
  anomalyDetectionEnabled: 'Automated anomaly detection',
  advancedDashboardsEnabled: 'Access to advanced dashboard features',
  realTimeUpdatesEnabled: 'Real-time data synchronization',
  mobileAccessEnabled: 'Mobile application access',
  bulkOperationsEnabled: 'Bulk data operations',
  advancedFiltersEnabled: 'Advanced filtering capabilities',
  emailProcessingEnabled: 'Automated email processing',
  autoReportingEnabled: 'Automated report generation',
  dataValidationEnabled: 'Advanced data validation'
};

const DEPARTMENT_COLORS = {
  maintenance: 'bg-blue-100 text-blue-800 border-blue-200',
  security: 'bg-red-100 text-red-800 border-red-200',
  facilities: 'bg-green-100 text-green-800 border-green-200',
  administration: 'bg-purple-100 text-purple-800 border-purple-200',
  finance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sustainability: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  operations: 'bg-orange-100 text-orange-800 border-orange-200'
};

export function DepartmentFeatureMatrix() {
  const { isAdmin } = useAuth();
  const { config } = useSystemSettings();
  const { toast } = useToast();
  
  const [departmentFeatures, setDepartmentFeatures] = useState<DepartmentFeatureConfig>({});
  const [selectedDepartment, setSelectedDepartment] = useState<string>('maintenance');
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize default department configurations
  useEffect(() => {
    const defaultConfig: DepartmentFeatureConfig = {};
    
    DEPARTMENTS.forEach(dept => {
      defaultConfig[dept] = {};
      Object.keys(FEATURE_DESCRIPTIONS).forEach(feature => {
        defaultConfig[dept][feature] = {
          enabled: config.features[feature as keyof typeof config.features] || false,
          override: 'inherit' as const,
          conditions: {
            timeRestricted: false,
            locationRestricted: false,
            emergencyOverride: true
          }
        };
      });
    });

    // Department-specific defaults
    if (defaultConfig.maintenance) {
      defaultConfig.maintenance.forecastingEnabled = { enabled: true, override: 'force_enable', conditions: { emergencyOverride: true, timeRestricted: false, locationRestricted: false } };
      defaultConfig.maintenance.anomalyDetectionEnabled = { enabled: true, override: 'force_enable', conditions: { emergencyOverride: true, timeRestricted: false, locationRestricted: false } };
    }
    
    if (defaultConfig.security) {
      defaultConfig.security.realTimeUpdatesEnabled = { enabled: true, override: 'force_enable', conditions: { emergencyOverride: true, timeRestricted: false, locationRestricted: false } };
      defaultConfig.security.advancedFiltersEnabled = { enabled: true, override: 'force_enable', conditions: { emergencyOverride: true, timeRestricted: false, locationRestricted: false } };
    }
    
    if (defaultConfig.finance) {
      defaultConfig.finance.autoReportingEnabled = { enabled: true, override: 'force_enable', conditions: { emergencyOverride: false, timeRestricted: true, locationRestricted: false } };
      defaultConfig.finance.dataExportEnabled = { enabled: true, override: 'force_enable', conditions: { emergencyOverride: false, timeRestricted: true, locationRestricted: false } };
    }

    setDepartmentFeatures(defaultConfig);
  }, [config.features]);

  const handleFeatureToggle = (department: string, feature: string, enabled: boolean) => {
    setDepartmentFeatures(prev => ({
      ...prev,
      [department]: {
        ...prev[department],
        [feature]: {
          ...prev[department][feature],
          enabled
        }
      }
    }));
  };

  const handleOverrideChange = (department: string, feature: string, override: string) => {
    setDepartmentFeatures(prev => ({
      ...prev,
      [department]: {
        ...prev[department],
        [feature]: {
          ...prev[department][feature],
          override: override as 'inherit' | 'force_enable' | 'force_disable'
        }
      }
    }));
  };

  const handleConditionToggle = (department: string, feature: string, condition: string, value: boolean) => {
    setDepartmentFeatures(prev => ({
      ...prev,
      [department]: {
        ...prev[department],
        [feature]: {
          ...prev[department][feature],
          conditions: {
            ...prev[department][feature].conditions,
            [condition]: value
          }
        }
      }
    }));
  };

  const saveDepartmentConfig = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to save department feature configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Configuration Saved",
        description: "Department feature access rules have been updated successfully.",
      });
      
      setShowEditor(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save department configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
            <p className="text-muted-foreground">You need administrator privileges to access department feature management.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDepartmentStats = (dept: string) => {
    const features = departmentFeatures[dept] || {};
    const total = Object.keys(features).length;
    const enabled = Object.values(features).filter(f => f.enabled).length;
    const overridden = Object.values(features).filter(f => f.override !== 'inherit').length;
    return { total, enabled, overridden };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Department Feature Access Control
          </h3>
          <p className="text-muted-foreground">
            Configure feature access at the department level with hierarchical inheritance and conditional controls.
          </p>
        </div>
        <Dialog open={showEditor} onOpenChange={setShowEditor}>
          <DialogTrigger asChild>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure Departments
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Department Feature Configuration</DialogTitle>
              <DialogDescription>
                Configure feature access, overrides, and conditions for each department.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <TabsList className="grid grid-cols-4 lg:grid-cols-7 mb-6">
                {DEPARTMENTS.map((dept) => (
                  <TabsTrigger key={dept} value={dept} className="text-xs">
                    {dept.charAt(0).toUpperCase() + dept.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {DEPARTMENTS.map((dept) => (
                <TabsContent key={dept} value={dept} className="space-y-4">
                  <div className="grid gap-4">
                    {Object.entries(FEATURE_DESCRIPTIONS).map(([feature, description]) => {
                      const featureConfig = departmentFeatures[dept]?.[feature];
                      if (!featureConfig) return null;

                      return (
                        <Card key={feature} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <Label className="font-medium">{feature}</Label>
                                <p className="text-sm text-muted-foreground">{description}</p>
                              </div>
                              <Switch
                                checked={featureConfig.enabled}
                                onCheckedChange={(enabled) => handleFeatureToggle(dept, feature, enabled)}
                              />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
                              <div className="space-y-2">
                                <Label className="text-xs">Override Behavior</Label>
                                <Select
                                  value={featureConfig.override}
                                  onValueChange={(value) => handleOverrideChange(dept, feature, value)}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="inherit">Inherit from Global</SelectItem>
                                    <SelectItem value="force_enable">Force Enable</SelectItem>
                                    <SelectItem value="force_disable">Force Disable</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs">Conditions</Label>
                                <div className="flex flex-wrap gap-1">
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="checkbox"
                                      id={`${dept}-${feature}-time`}
                                      checked={featureConfig.conditions?.timeRestricted || false}
                                      onChange={(e) => handleConditionToggle(dept, feature, 'timeRestricted', e.target.checked)}
                                      className="h-3 w-3"
                                    />
                                    <Label htmlFor={`${dept}-${feature}-time`} className="text-xs">
                                      <Clock className="h-3 w-3 inline mr-1" />
                                      Time
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="checkbox"
                                      id={`${dept}-${feature}-location`}
                                      checked={featureConfig.conditions?.locationRestricted || false}
                                      onChange={(e) => handleConditionToggle(dept, feature, 'locationRestricted', e.target.checked)}
                                      className="h-3 w-3"
                                    />
                                    <Label htmlFor={`${dept}-${feature}-location`} className="text-xs">
                                      <MapPin className="h-3 w-3 inline mr-1" />
                                      Location
                                    </Label>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-xs">Emergency Override</Label>
                                <Switch
                                  checked={featureConfig.conditions?.emergencyOverride || false}
                                  onCheckedChange={(enabled) => handleConditionToggle(dept, feature, 'emergencyOverride', enabled)}
                                />
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowEditor(false)}>
                Cancel
              </Button>
              <Button onClick={saveDepartmentConfig} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Department Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DEPARTMENTS.map((dept) => {
          const stats = getDepartmentStats(dept);
          const deptConfig = departmentFeatures[dept] || {};
          
          return (
            <Card key={dept} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {dept.charAt(0).toUpperCase() + dept.slice(1)}
                  </CardTitle>
                  <Badge variant="outline" className={DEPARTMENT_COLORS[dept as keyof typeof DEPARTMENT_COLORS]}>
                    {stats.enabled}/{stats.total}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Enabled: {stats.enabled}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Overrides: {stats.overridden}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {Object.entries(deptConfig).slice(0, 3).map(([feature, config]) => (
                    <div key={feature} className="flex items-center justify-between text-xs">
                      <span className="truncate">{feature}</span>
                      <div className="flex gap-1">
                        {config.enabled && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                        {config.override !== 'inherit' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                        {config.conditions?.timeRestricted && <Clock className="h-2 w-2 text-amber-500" />}
                        {config.conditions?.locationRestricted && <MapPin className="h-2 w-2 text-purple-500" />}
                      </div>
                    </div>
                  ))}
                  {Object.keys(deptConfig).length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{Object.keys(deptConfig).length - 3} more features
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}