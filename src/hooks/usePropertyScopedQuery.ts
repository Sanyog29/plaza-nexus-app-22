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
    const propertyId = getPropertyFilter(options);
    
    if (propertyId) {
      return query.eq('property_id', propertyId);
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