
/**
 * Utility functions for handling category data from Supabase queries
 */

export interface CategoryData {
  name: string;
  icon?: string;
}

/**
 * Extracts category name from Supabase category relationship data
 * Handles both array and single object formats
 */
export const extractCategoryName = (category: any): string => {
  if (!category) return 'Unknown';
  
  // Handle array format (from joins)
  if (Array.isArray(category) && category.length > 0) {
    return category[0].name || 'Unknown';
  }
  
  // Handle single object format
  if (typeof category === 'object' && category.name) {
    return category.name;
  }
  
  return 'Unknown';
};

/**
 * Extracts full category data from Supabase category relationship data
 * Handles both array and single object formats
 */
export const extractCategoryData = (category: any): CategoryData => {
  if (!category) return { name: 'Unknown' };
  
  // Handle array format (from joins)
  if (Array.isArray(category) && category.length > 0) {
    const cat = category[0];
    return {
      name: cat.name || 'Unknown',
      icon: cat.icon
    };
  }
  
  // Handle single object format
  if (typeof category === 'object' && category.name) {
    return {
      name: category.name,
      icon: category.icon
    };
  }
  
  return { name: 'Unknown' };
};

/**
 * Creates a consistent category processing function for maintenance requests
 */
export const processCategoryInRequest = (request: any) => {
  const categoryData = extractCategoryData(request.main_categories || request.maintenance_categories);
  return {
    ...request,
    category: categoryData
  };
};
