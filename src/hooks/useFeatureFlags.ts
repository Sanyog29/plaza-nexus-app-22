import { useSystemSettings } from './useSystemSettings';

export const useFeatureFlags = () => {
  const { config } = useSystemSettings();

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
    // Data Source Features
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
    features
  };
};