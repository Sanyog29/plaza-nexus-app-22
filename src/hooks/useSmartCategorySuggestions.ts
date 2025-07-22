
import { useMemo } from 'react';

interface CategorySuggestion {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  confidence: number;
  reason: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  usage_count?: number;
}

const KEYWORD_MAPPINGS = {
  // Plumbing keywords
  'water': 'Plumbing',
  'leak': 'Plumbing', 
  'pipe': 'Plumbing',
  'toilet': 'Plumbing',
  'sink': 'Plumbing',
  'faucet': 'Plumbing',
  'drain': 'Plumbing',
  'bathroom': 'Plumbing',
  'shower': 'Plumbing',
  
  // Electrical keywords
  'light': 'Electrical',
  'power': 'Electrical',
  'outlet': 'Electrical',
  'switch': 'Electrical',
  'electric': 'Electrical',
  'wiring': 'Electrical',
  'breaker': 'Electrical',
  
  // HVAC keywords
  'air': 'HVAC',
  'temperature': 'HVAC',
  'heating': 'HVAC',
  'cooling': 'HVAC',
  'ac': 'HVAC',
  'ventilation': 'HVAC',
  'thermostat': 'HVAC',
  
  // IT keywords
  'computer': 'IT Support',
  'internet': 'IT Support',
  'wifi': 'IT Support',
  'network': 'IT Support',
  'printer': 'IT Support',
  'phone': 'IT Support',
  'system': 'IT Support',
  
  // Cleaning keywords
  'clean': 'Cleaning',
  'dirty': 'Cleaning',
  'trash': 'Cleaning',
  'garbage': 'Cleaning',
  'spill': 'Cleaning',
  'stain': 'Cleaning',
  
  // Maintenance keywords
  'broken': 'General Maintenance',
  'repair': 'General Maintenance',
  'fix': 'General Maintenance',
  'maintenance': 'General Maintenance',
  'door': 'General Maintenance',
  'window': 'General Maintenance',
  'lock': 'Security'
};

const LOCATION_MAPPINGS = {
  'kitchen': ['Plumbing', 'Electrical', 'Cleaning'],
  'bathroom': ['Plumbing', 'Electrical', 'Cleaning'],
  'office': ['IT Support', 'Electrical', 'HVAC'],
  'conference': ['IT Support', 'HVAC', 'Electrical'],
  'lobby': ['Cleaning', 'HVAC', 'General Maintenance'],
  'parking': ['Security', 'General Maintenance', 'Lighting'],
  'cafeteria': ['Plumbing', 'Cleaning', 'HVAC'],
  'restroom': ['Plumbing', 'Cleaning', 'General Maintenance']
};

export const useSmartCategorySuggestions = (
  categories: Category[],
  description: string,
  location: string
) => {
  return useMemo(() => {
    const suggestions: CategorySuggestion[] = [];
    const processedCategories = new Set<string>();

    // Sort categories by usage count (most used first)
    const sortedCategories = [...categories].sort((a, b) => 
      (b.usage_count || 0) - (a.usage_count || 0)
    );

    // Get suggestions based on description keywords
    if (description) {
      const words = description.toLowerCase().split(/\s+/);
      words.forEach(word => {
        const suggestedCategoryName = KEYWORD_MAPPINGS[word];
        if (suggestedCategoryName) {
          const category = categories.find(c => 
            c.name.toLowerCase().includes(suggestedCategoryName.toLowerCase())
          );
          if (category && !processedCategories.has(category.id)) {
            suggestions.push({
              ...category,
              confidence: 0.9,
              reason: `Matches keyword: "${word}"`
            });
            processedCategories.add(category.id);
          }
        }
      });
    }

    // Get suggestions based on location
    if (location) {
      const locationKey = Object.keys(LOCATION_MAPPINGS).find(key =>
        location.toLowerCase().includes(key)
      );
      
      if (locationKey) {
        const suggestedCategories = LOCATION_MAPPINGS[locationKey];
        suggestedCategories.forEach(categoryName => {
          const category = categories.find(c => 
            c.name.toLowerCase().includes(categoryName.toLowerCase())
          );
          if (category && !processedCategories.has(category.id)) {
            suggestions.push({
              ...category,
              confidence: 0.7,
              reason: `Common for ${locationKey} locations`
            });
            processedCategories.add(category.id);
          }
        });
      }
    }

    // Add popular categories (top 3 most used)
    sortedCategories.slice(0, 3).forEach(category => {
      if (!processedCategories.has(category.id) && category.usage_count && category.usage_count > 0) {
        suggestions.push({
          ...category,
          confidence: 0.5,
          reason: `Popular choice (${category.usage_count} uses)`
        });
        processedCategories.add(category.id);
      }
    });

    // Sort suggestions by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }, [categories, description, location]);
};
