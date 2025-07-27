import { useSystemSettings } from './useSystemSettings';
import { useAuth } from '@/components/AuthProvider';

export const useFeatureFlags = () => {
  const { config } = useSystemSettings();
  const { userRole } = useAuth();

  const features = config.features || {
    csvImportEnabled: true,
    dataExportEnabled: true,
    googleSheetsEnabled: false,
    forecastingEnabled: false,
    anomalyDetectionEnabled: false,
    advancedDashboardsEnabled: true,
    realTimeUpdatesEnabled: false,
    mobileAccessEnabled: true,
    bulkOperationsEnabled: true,
    advancedFiltersEnabled: true,
    emailProcessingEnabled: false,
    autoReportingEnabled: false,
    dataValidationEnabled: true,
  };

  return {
    // Data Source Features (global only - use useRoleBasedFeatures for role-aware access)
    canImportCSV: features.csvImportEnabled,
    canExportData: features.dataExportEnabled,
    canUseGoogleSheets: features.googleSheetsEnabled,
    
    // Analytics Features
    canForecast: features.forecastingEnabled,
    canDetectAnomalies: features.anomalyDetectionEnabled,
    canUseAdvancedDashboards: features.advancedDashboardsEnabled,
    canUseRealTimeUpdates: features.realTimeUpdatesEnabled,
    
    // User Access Features
    canUseMobile: features.mobileAccessEnabled,
    canPerformBulkOperations: features.bulkOperationsEnabled,
    canUseAdvancedFilters: features.advancedFiltersEnabled,
    
    // Automation Features
    canProcessEmail: features.emailProcessingEnabled,
    canAutoGenerateReports: features.autoReportingEnabled,
    canValidateData: features.dataValidationEnabled,
    
    // Feature object for direct access
    features,
    
    // Role information
    userRole,
    
    // Helper to check if feature should consider role restrictions
    isGlobalFeatureEnabled: (featureName: keyof typeof features) => features[featureName],
    
    // Deprecation notice: Use useRoleBasedFeatures for role-aware feature access
    __deprecated_notice: 'For role-based feature access, use useRoleBasedFeatures hook instead'
  };
};