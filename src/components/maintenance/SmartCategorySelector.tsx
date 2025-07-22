
import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, TrendingUp, Lightbulb } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSmartCategorySuggestions } from '@/hooks/useSmartCategorySuggestions';
import MobileCategorySheet from './MobileCategorySheet';

interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  usage_count?: number;
}

interface SmartCategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  description?: string;
  location?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

const SmartCategorySelector: React.FC<SmartCategorySelectorProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  description = '',
  location = '',
  isLoading = false,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const suggestions = useSmartCategorySuggestions(categories, description, location);
  
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      // Sort by usage count (most used first)
      return (b.usage_count || 0) - (a.usage_count || 0);
    });
  }, [filteredCategories]);

  if (isMobile) {
    return (
      <div className="space-y-2">
        <Label htmlFor="category">Category *</Label>
        {suggestions.length > 0 && (
          <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
              <Lightbulb className="h-4 w-4" />
              Smart Suggestion
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              Based on your description: <strong>{suggestions[0].name}</strong>
            </div>
            <div className="text-xs text-muted-foreground">
              {suggestions[0].reason}
            </div>
          </div>
        )}
        <MobileCategorySheet
          categories={sortedCategories}
          suggestions={suggestions}
          selectedCategory={selectedCategory}
          onCategorySelect={onCategorySelect}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isOpen={isSheetOpen}
          onOpenChange={setIsSheetOpen}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category *</Label>
      
      {/* Smart Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
            <Star className="h-4 w-4" />
            Suggested Categories
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => onCategorySelect(suggestion.id)}
                className="flex items-center gap-2 px-3 py-1.5 bg-background border border-primary/30 rounded-md hover:bg-primary/10 transition-colors text-sm"
                disabled={disabled}
                type="button"
              >
                {suggestion.icon && <span>{suggestion.icon}</span>}
                <span>{suggestion.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {Math.round(suggestion.confidence * 100)}%
                </Badge>
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            💡 {suggestions[0].reason}
          </div>
        </div>
      )}

      <Select value={selectedCategory} onValueChange={onCategorySelect} disabled={isLoading || disabled}>
        <SelectTrigger className="bg-card border-gray-600">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent className="bg-card border-gray-600 max-h-80">
          {/* Search in dropdown */}
          <div className="p-2 border-b border-gray-600">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 bg-background border-gray-600"
              />
            </div>
          </div>

          {/* Popular Categories Section */}
          {!searchTerm && (
            <>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Most Popular
              </div>
              {sortedCategories
                .filter(c => c.usage_count && c.usage_count > 0)
                .slice(0, 3)
                .map((category) => (
                  <SelectItem key={`popular-${category.id}`} value={category.id} className="hover:bg-gray-800">
                    <div className="flex items-center gap-2 w-full">
                      {category.icon && <span className="text-lg">{category.icon}</span>}
                      <div className="flex-1">
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-gray-400">{category.description}</div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {category.usage_count}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              <div className="border-t border-gray-600 my-1"></div>
            </>
          )}

          {/* All Categories */}
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
            {searchTerm ? `Search Results (${filteredCategories.length})` : 'All Categories'}
          </div>
          {sortedCategories.map((category) => (
            <SelectItem key={category.id} value={category.id} className="hover:bg-gray-800">
              <div className="flex items-center gap-2 w-full">
                {category.icon && <span className="text-lg">{category.icon}</span>}
                <div className="flex-1">
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-gray-400">{category.description}</div>
                  )}
                </div>
                {category.usage_count && category.usage_count > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {category.usage_count}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
          
          {filteredCategories.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No categories found matching "{searchTerm}"
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SmartCategorySelector;
