import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface MenuCategory {
  id: string;
  name: string;
  display_order?: number;
}

interface CategoryTabsProps {
  categories: MenuCategory[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  getCategoryItemCount: (categoryId: string) => number;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  getCategoryItemCount,
}) => {
  const sortedCategories = categories.sort((a, b) => 
    (a.display_order || 0) - (b.display_order || 0)
  );

  const allItemsCount = categories.reduce((total, category) => 
    total + getCategoryItemCount(category.id), 0
  );

  return (
    <div className="px-6 py-4 border-b bg-background">
      <Tabs value={selectedCategory} onValueChange={onCategoryChange} className="w-full">
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground gap-1 w-auto">
          <TabsTrigger 
            value="all" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm h-8"
          >
            <span className="leading-none">All Items</span>
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs leading-none">
              {allItemsCount}
            </Badge>
          </TabsTrigger>
          
          {sortedCategories.map((category) => {
            const itemCount = getCategoryItemCount(category.id);
            return (
              <TabsTrigger 
                key={category.id} 
                value={category.id}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm h-8"
              >
                <span className="leading-none">{category.name}</span>
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs leading-none">
                  {itemCount}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};