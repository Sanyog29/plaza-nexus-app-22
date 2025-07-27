import { useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useFeatureFlags } from './useFeatureFlags';

interface HierarchicalFeatureConfig {
  global: Record<string, boolean>;
  department: Record<string, Record<string, {
    enabled: boolean;
    override: 'inherit' | 'force_enable' | 'force_disable';
    conditions?: {
      timeRestricted?: boolean;
      locationRestricted?: boolean;
      emergencyOverride?: boolean;
    };
  }>>;
  role: Record<string, Record<string, boolean>>;
  user: Record<string, Record<string, boolean>>;
}

interface PermissionContext {
  currentTime?: Date;
  userLocation?: {
    ip?: string;
    coordinates?: { lat: number; lng: number };
    buildingId?: string;
  };
  isEmergency?: boolean;
}

export const useHierarchicalPermissions = (context: PermissionContext = {}) => {
  const { userRole, userDepartment } = useAuth();
  const { features } = useFeatureFlags();

  // Mock hierarchical configuration - in real implementation, this would come from backend
  const hierarchicalConfig: HierarchicalFeatureConfig = useMemo(() => ({
    global: features,
    department: {
      maintenance: {
        forecastingEnabled: { enabled: true, override: 'force_enable' },
        anomalyDetectionEnabled: { enabled: true, override: 'force_enable' },
        realTimeUpdatesEnabled: { enabled: true, override: 'inherit' },
      },
      security: {
        realTimeUpdatesEnabled: { enabled: true, override: 'force_enable' },
        advancedFiltersEnabled: { enabled: true, override: 'force_enable' },
        bulkOperationsEnabled: { enabled: false, override: 'force_disable' },
      },
      finance: {
        autoReportingEnabled: { 
          enabled: true, 
          override: 'force_enable',
          conditions: { timeRestricted: true, emergencyOverride: false }
        },
        dataExportEnabled: { 
          enabled: true, 
          override: 'force_enable',
          conditions: { timeRestricted: true, locationRestricted: true }
        },
      },
      operations: {
        bulkOperationsEnabled: { enabled: true, override: 'inherit' },
        csvImportEnabled: { enabled: true, override: 'inherit' },
      },
    },
    role: {
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
      ops_supervisor: {
        csvImportEnabled: true,
        dataExportEnabled: true,
        forecastingEnabled: true,
        advancedDashboardsEnabled: true,
        realTimeUpdatesEnabled: true,
        bulkOperationsEnabled: true,
        advancedFiltersEnabled: true,
        dataValidationEnabled: true,
      },
      field_staff: {
        mobileAccessEnabled: true,
        realTimeUpdatesEnabled: true,
        dataValidationEnabled: true,
      },
    },
    user: {
      // User-specific overrides would be stored here
    }
  }), [features]);

  const evaluateTimeRestriction = (featureName: string): boolean => {
    const deptConfig = hierarchicalConfig.department[userDepartment || '']?.[featureName];
    
    if (!deptConfig?.conditions?.timeRestricted) return true;
    
    const currentTime = context.currentTime || new Date();
    const currentHour = currentTime.getHours();
    const currentDay = currentTime.getDay();
    
    // Business hours: Monday-Friday, 9 AM - 5 PM
    const isBusinessHours = currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 17;
    
    // Allow emergency override
    if (context.isEmergency && deptConfig.conditions?.emergencyOverride) {
      return true;
    }
    
    return isBusinessHours;
  };

  const evaluateLocationRestriction = (featureName: string): boolean => {
    const deptConfig = hierarchicalConfig.department[userDepartment || '']?.[featureName];
    
    if (!deptConfig?.conditions?.locationRestricted) return true;
    
    // Mock location validation - in real implementation, check against configured restrictions
    const hasValidLocation = Boolean(
      context.userLocation?.ip || 
      context.userLocation?.buildingId ||
      context.userLocation?.coordinates
    );
    
    // Allow emergency override
    if (context.isEmergency && deptConfig.conditions?.emergencyOverride) {
      return true;
    }
    
    return hasValidLocation;
  };

  const resolveFeatureAccess = (featureName: string): boolean => {
    // Priority order: User > Role > Department > Global
    
    // 1. Check user-specific overrides
    if (userRole && hierarchicalConfig.user[userRole]?.[featureName] !== undefined) {
      return hierarchicalConfig.user[userRole][featureName];
    }
    
    // 2. Check department-specific configuration
    if (userDepartment && hierarchicalConfig.department[userDepartment]?.[featureName]) {
      const deptConfig = hierarchicalConfig.department[userDepartment][featureName];
      
      // Check conditional restrictions
      if (!evaluateTimeRestriction(featureName) || !evaluateLocationRestriction(featureName)) {
        return false;
      }
      
      switch (deptConfig.override) {
        case 'force_enable':
          return true;
        case 'force_disable':
          return false;
        case 'inherit':
          // Fall through to role/global check
          break;
        default:
          return deptConfig.enabled;
      }
    }
    
    // 3. Check role-specific configuration
    if (userRole && hierarchicalConfig.role[userRole]?.[featureName] !== undefined) {
      return hierarchicalConfig.role[userRole][featureName];
    }
    
    // 4. Fall back to global configuration
    return hierarchicalConfig.global[featureName] || false;
  };

  const getPermissionChain = (featureName: string) => {
    const chain = [];
    
    // Global level
    chain.push({
      level: 'global',
      enabled: hierarchicalConfig.global[featureName] || false,
      source: 'System Configuration'
    });
    
    // Role level
    if (userRole && hierarchicalConfig.role[userRole]?.[featureName] !== undefined) {
      chain.push({
        level: 'role',
        enabled: hierarchicalConfig.role[userRole][featureName],
        source: `Role: ${userRole}`
      });
    }
    
    // Department level
    if (userDepartment && hierarchicalConfig.department[userDepartment]?.[featureName]) {
      const deptConfig = hierarchicalConfig.department[userDepartment][featureName];
      chain.push({
        level: 'department',
        enabled: deptConfig.enabled,
        override: deptConfig.override,
        conditions: deptConfig.conditions,
        source: `Department: ${userDepartment}`
      });
    }
    
    // User level
    if (userRole && hierarchicalConfig.user[userRole]?.[featureName] !== undefined) {
      chain.push({
        level: 'user',
        enabled: hierarchicalConfig.user[userRole][featureName],
        source: 'User Override'
      });
    }
    
    return chain;
  };

  const getDisabledReason = (featureName: string): string | null => {
    if (resolveFeatureAccess(featureName)) return null;
    
    const chain = getPermissionChain(featureName);
    
    // Check for time restrictions
    const deptConfig = hierarchicalConfig.department[userDepartment || '']?.[featureName];
    if (deptConfig?.conditions?.timeRestricted && !evaluateTimeRestriction(featureName)) {
      return 'Access restricted outside business hours (9 AM - 5 PM, Monday-Friday)';
    }
    
    // Check for location restrictions
    if (deptConfig?.conditions?.locationRestricted && !evaluateLocationRestriction(featureName)) {
      return 'Access restricted from current location';
    }
    
    // Find the blocking level
    const blockingLevel = chain.reverse().find(level => !level.enabled);
    if (blockingLevel) {
      return `Access denied by ${blockingLevel.source}`;
    }
    
    return 'Feature not available for your role';
  };

  const hierarchicalFeatures = useMemo(() => {
    const featureList = Object.keys(features);
    const result: Record<string, boolean> = {};
    
    featureList.forEach(feature => {
      result[feature] = resolveFeatureAccess(feature);
    });
    
    return result;
  }, [features, userRole, userDepartment, context]);

  return {
    // Feature access with hierarchical resolution
    hierarchicalFeatures,
    
    // Individual feature check
    hasFeature: (featureName: string) => resolveFeatureAccess(featureName),
    
    // Permission resolution chain
    getPermissionChain,
    
    // Reason for denied access
    getDisabledReason,
    
    // Context evaluation utilities
    evaluateTimeRestriction,
    evaluateLocationRestriction,
    
    // Current user context
    userRole,
    userDepartment,
    context,
    
    // Override utilities
    canUseEmergencyOverride: (featureName: string) => {
      const deptConfig = hierarchicalConfig.department[userDepartment || '']?.[featureName];
      return Boolean(deptConfig?.conditions?.emergencyOverride);
    },
    
    // Configuration inspection
    getHierarchicalConfig: () => hierarchicalConfig
  };
};