
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronDown, Star, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';

interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  usage_count?: number;
}

interface CategorySuggestion {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  confidence: number;
  reason: string;
}

interface MobileCategorySheetProps {
  categories: Category[];
  suggestions: CategorySuggestion[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileCategorySheet: React.FC<MobileCategorySheetProps> = ({
  categories,
  suggestions,
  selectedCategory,
  onCategorySelect,
  searchTerm,
  onSearchChange,
  isOpen,
  onOpenChange
}) => {
  const isMobile = useIsMobile();

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  const handleCategorySelect = (categoryId: string) => {
    onCategorySelect(categoryId);
    onOpenChange(false);
  };

  if (!isMobile) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between text-left bg-card border-gray-600 h-12"
        >
          {selectedCategoryData ? (
            <div className="flex items-center gap-2">
              {selectedCategoryData.icon && <span className="text-lg">{selectedCategoryData.icon}</span>}
              <span>{selectedCategoryData.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select a category</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] bg-card border-gray-600">
        <SheetHeader className="text-left">
          <SheetTitle>Select Category</SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 bg-background border-gray-600"
            />
          </div>

          {/* Suggestions Section */}
          {suggestions.length > 0 && !searchTerm && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Star className="h-4 w-4" />
                Suggested for you
              </div>
              <div className="space-y-1">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <Button
                    key={suggestion.id}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3 border border-primary/20 bg-primary/5"
                    onClick={() => handleCategorySelect(suggestion.id)}
                  >
                    <div className="flex items-start gap-3 text-left">
                      {suggestion.icon && (
                        <span className="text-lg mt-0.5">{suggestion.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{suggestion.name}</div>
                        <div className="text-xs text-primary mt-1">
                          {suggestion.reason}
                        </div>
                        {suggestion.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {suggestion.description}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Categories */}
          {!searchTerm && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Most Popular
              </div>
              <div className="grid grid-cols-2 gap-2">
                {categories
                  .filter(c => c.usage_count && c.usage_count > 0)
                  .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
                  .slice(0, 4)
                  .map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      className="h-auto p-3 text-left"
                      onClick={() => handleCategorySelect(category.id)}
                    >
                      <div className="flex items-center gap-2">
                        {category.icon && <span className="text-lg">{category.icon}</span>}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{category.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {category.usage_count} uses
                          </div>
                        </div>
                      </div>
                    </Button>
                  ))}
              </div>
            </div>
          )}

          {/* All Categories */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              {searchTerm ? `Search Results (${filteredCategories.length})` : 'All Categories'}
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <div className="flex items-center gap-3 text-left">
                    {category.icon && (
                      <span className="text-lg">{category.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {category.description}
                        </div>
                      )}
                    </div>
                    {category.usage_count && category.usage_count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {category.usage_count}
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileCategorySheet;
