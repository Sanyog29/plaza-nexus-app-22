import { useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useFeatureFlags } from './useFeatureFlags';

interface RoleFeatureMatrix {
  [role: string]: {
    [feature: string]: boolean;
  };
}

// Default role-based feature access matrix
const DEFAULT_ROLE_FEATURES: RoleFeatureMatrix = {
  admin: {
    csvImportEnabled: true,
    dataExportEnabled: true,
    googleSheetsEnabled: true,
    forecastingEnabled: true,
    anomalyDetectionEnabled: true,
    advancedDashboardsEnabled: true,
    realTimeUpdatesEnabled: true,
    mobileAccessEnabled: true,
    bulkOperationsEnabled: true,
    advancedFiltersEnabled: true,
    emailProcessingEnabled: true,
    autoReportingEnabled: true,
    dataValidationEnabled: true,
  },
  // L2 Management roles
  assistant_manager: {
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
  assistant_floor_manager: {
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
  // L3 Senior Management roles
  assistant_general_manager: {
    csvImportEnabled: true,
    dataExportEnabled: true,
    googleSheetsEnabled: true,
    forecastingEnabled: true,
    anomalyDetectionEnabled: true,
    advancedDashboardsEnabled: true,
    realTimeUpdatesEnabled: true,
    mobileAccessEnabled: true,
    bulkOperationsEnabled: true,
    advancedFiltersEnabled: true,
    emailProcessingEnabled: true,
    autoReportingEnabled: true,
    dataValidationEnabled: true,
  },
  assistant_vice_president: {
    csvImportEnabled: true,
    dataExportEnabled: true,
    googleSheetsEnabled: true,
    forecastingEnabled: true,
    anomalyDetectionEnabled: true,
    advancedDashboardsEnabled: true,
    realTimeUpdatesEnabled: true,
    mobileAccessEnabled: true,
    bulkOperationsEnabled: true,
    advancedFiltersEnabled: true,
    emailProcessingEnabled: true,
    autoReportingEnabled: true,
    dataValidationEnabled: true,
  },
  // L4 Executive roles
  vp: {
    csvImportEnabled: false,
    dataExportEnabled: true,
    googleSheetsEnabled: false,
    forecastingEnabled: true,
    anomalyDetectionEnabled: false,
    advancedDashboardsEnabled: true,
    realTimeUpdatesEnabled: true,
    mobileAccessEnabled: true,
    bulkOperationsEnabled: false,
    advancedFiltersEnabled: true,
    emailProcessingEnabled: false,
    autoReportingEnabled: true,
    dataValidationEnabled: false,
  },
  ceo: {
    csvImportEnabled: false,
    dataExportEnabled: true,
    googleSheetsEnabled: false,
    forecastingEnabled: true,
    anomalyDetectionEnabled: false,
    advancedDashboardsEnabled: true,
    realTimeUpdatesEnabled: true,
    mobileAccessEnabled: true,
    bulkOperationsEnabled: false,
    advancedFiltersEnabled: true,
    emailProcessingEnabled: false,
    autoReportingEnabled: true,
    dataValidationEnabled: false,
  },
  cxo: {
    csvImportEnabled: false,
    dataExportEnabled: true,
    googleSheetsEnabled: false,
    forecastingEnabled: true,
    anomalyDetectionEnabled: false,
    advancedDashboardsEnabled: true,
    realTimeUpdatesEnabled: true,
    mobileAccessEnabled: true,
    bulkOperationsEnabled: false,
    advancedFiltersEnabled: true,
    emailProcessingEnabled: false,
    autoReportingEnabled: true,
    dataValidationEnabled: false,
  },
  // L1 Operational staff
  mst: {
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
  fe: {
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
  hk: {
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
  se: {
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
  tenant: {
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
  // Super Tenant - Read-only observer with analytics access
  super_tenant: {
    csvImportEnabled: false,           // ❌ No bulk imports
    dataExportEnabled: true,           // ✅ Export for analysis
    googleSheetsEnabled: false,
    forecastingEnabled: true,          // ✅ View forecasts
    anomalyDetectionEnabled: false,
    advancedDashboardsEnabled: true,   // ✅ Full dashboards
    realTimeUpdatesEnabled: true,      // ✅ Real-time monitoring
    mobileAccessEnabled: true,         // ✅ Mobile access
    bulkOperationsEnabled: false,      // ❌ No bulk actions
    advancedFiltersEnabled: true,      // ✅ Advanced filters
    emailProcessingEnabled: false,
    autoReportingEnabled: true,        // ✅ Generate reports
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

export const useRoleBasedFeatures = () => {
  const { userRole } = useAuth();
  const { features: globalFeatures } = useFeatureFlags();

  const roleBasedFeatures = useMemo(() => {
    if (!userRole) return {};

    const roleFeatures = DEFAULT_ROLE_FEATURES[userRole] || {};
    
    // Combine global feature flags with role-based restrictions
    const combinedFeatures: { [key: string]: boolean } = {};
    
    Object.keys(globalFeatures).forEach(feature => {
      // Feature is enabled only if both global flag is true AND role has access
      combinedFeatures[feature] = globalFeatures[feature] && (roleFeatures[feature] ?? false);
    });

    return combinedFeatures;
  }, [userRole, globalFeatures]);

  return {
    // Enhanced feature flags that consider both global settings and role permissions
    canImportCSV: roleBasedFeatures.csvImportEnabled,
    canExportData: roleBasedFeatures.dataExportEnabled,
    canUseGoogleSheets: roleBasedFeatures.googleSheetsEnabled,
    canForecast: roleBasedFeatures.forecastingEnabled,
    canDetectAnomalies: roleBasedFeatures.anomalyDetectionEnabled,
    canUseAdvancedDashboards: roleBasedFeatures.advancedDashboardsEnabled,
    canUseRealTimeUpdates: roleBasedFeatures.realTimeUpdatesEnabled,
    canUseMobile: roleBasedFeatures.mobileAccessEnabled,
    canPerformBulkOperations: roleBasedFeatures.bulkOperationsEnabled,
    canUseAdvancedFilters: roleBasedFeatures.advancedFiltersEnabled,
    canProcessEmail: roleBasedFeatures.emailProcessingEnabled,
    canAutoGenerateReports: roleBasedFeatures.autoReportingEnabled,
    canValidateData: roleBasedFeatures.dataValidationEnabled,
    
    // Raw feature object for direct access
    features: roleBasedFeatures,
    userRole,
    
    // Helper methods
    hasFeature: (featureName: string) => Boolean(roleBasedFeatures[featureName]),
    getDisabledReason: (featureName: string) => {
      if (!globalFeatures[featureName]) {
        return 'This feature is currently disabled system-wide';
      }
      if (!roleBasedFeatures[featureName]) {
        return `This feature is not available for your role (${userRole})`;
      }
      return null;
    }
  };
};