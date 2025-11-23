import { usePropertyContext } from '@/contexts/PropertyContext';

interface PropertyScopeOptions {
  respectPropertyScope?: boolean; // Set to false to bypass property filtering
}

export const usePropertyScopedQuery = () => {
  const { currentProperty, isSuperAdmin } = usePropertyContext();

  const getPropertyFilter = (options: PropertyScopeOptions = {}) => {
    const { respectPropertyScope = true } = options;

    // If not respecting scope or super admin viewing all properties, no filter
    if (!respectPropertyScope || (isSuperAdmin && !currentProperty)) {
      return null;
    }

    // Return current property ID for filtering
    return currentProperty?.id || null;
  };

  const applyPropertyFilter = <T extends Record<string, any>>(
    query: any,
    options: PropertyScopeOptions = {}
  ) => {
    const { respectPropertyScope = true } = options;
    
    // CRITICAL: Super admins viewing "All Properties" can bypass
    if (isSuperAdmin && !currentProperty && !respectPropertyScope) {
      return query;
    }
    
    // For everyone else, property filtering is MANDATORY
    const propertyId = getPropertyFilter(options);
    
    if (propertyId) {
      return query.eq('property_id', propertyId);
    }

    // If no property context but respectPropertyScope is true, block the query
    if (respectPropertyScope && !isSuperAdmin) {
      console.warn('Property filter required but no property context available');
      // Return impossible filter to prevent data leakage
      return query.eq('property_id', '00000000-0000-0000-0000-000000000000');
    }

    return query;
  };

  return {
    currentProperty,
    isSuperAdmin,
    getPropertyFilter,
    applyPropertyFilter,
  };
};