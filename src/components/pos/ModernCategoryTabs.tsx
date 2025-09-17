import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Coffee, 
  Sandwich, 
  Cookie, 
  Salad, 
  Pizza, 
  IceCream, 
  Wine, 
  MoreHorizontal,
  Grid3X3
} from 'lucide-react';

interface MenuCategory {
  id: string;
  name: string;
  display_order?: number;
}

interface ModernCategoryTabsProps {
  categories: MenuCategory[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  getCategoryItemCount: (categoryId: string) => number;
}

const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes('coffee') || name.includes('drink') || name.includes('beverage')) return Coffee;
  if (name.includes('sandwich') || name.includes('burger') || name.includes('main')) return Sandwich;
  if (name.includes('dessert') || name.includes('cookie') || name.includes('sweet')) return Cookie;
  if (name.includes('salad') || name.includes('healthy') || name.includes('fresh')) return Salad;
  if (name.includes('pizza') || name.includes('italian')) return Pizza;
  if (name.includes('ice') || name.includes('cream') || name.includes('frozen')) return IceCream;
  if (name.includes('wine') || name.includes('alcohol') || name.includes('bar')) return Wine;
  return MoreHorizontal;
};

export const ModernCategoryTabs: React.FC<ModernCategoryTabsProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  getCategoryItemCount
}) => {
  const sortedCategories = [...categories].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
  );

  const allItemsCount = categories.reduce((total, category) => 
    total + getCategoryItemCount(category.id), 0
  );

  return (
    <div className="bg-card border-b border-border px-4 py-4">
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {/* All Menu Tab */}
          <Button
            variant={selectedCategory === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => onCategoryChange("all")}
            className="flex items-center gap-2 whitespace-nowrap rounded-full"
          >
            <Grid3X3 className="h-4 w-4" />
            All Menu
            <Badge variant="secondary" className="ml-1 text-xs">
              {allItemsCount}
            </Badge>
          </Button>

          {/* Category Tabs */}
          {sortedCategories.map((category) => {
            const IconComponent = getCategoryIcon(category.name);
            const itemCount = getCategoryItemCount(category.id);
            
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "ghost"}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                className="flex items-center gap-2 whitespace-nowrap rounded-full"
              >
                <IconComponent className="h-4 w-4" />
                {category.name}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {itemCount}
                </Badge>
              </Button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};