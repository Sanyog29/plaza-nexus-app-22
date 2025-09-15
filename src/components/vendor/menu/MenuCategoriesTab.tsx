import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Package, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface MenuCategoriesTabProps {
  vendorId: string;
  refreshTrigger: number;
}

interface CategoryStats {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  display_order: number;
  total_items: number;
  available_items: number;
  unavailable_items: number;
  featured_items: number;
}

const MenuCategoriesTab: React.FC<MenuCategoriesTabProps> = ({ vendorId, refreshTrigger }) => {
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoryStats = async () => {
    try {
      setLoading(true);
      
      // Fetch categories with item statistics
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('cafeteria_menu_categories')
        .select(`
          id,
          name,
          description,
          image_url,
          is_featured,
          display_order
        `)
        .eq('vendor_id', vendorId)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Fetch item counts for each category
      const categoryStats = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { data: itemsData, error: itemsError } = await supabase
            .from('vendor_menu_items')
            .select('is_available, is_featured')
            .eq('vendor_id', vendorId)
            .eq('category_id', category.id);

          if (itemsError) {
            console.error('Error fetching items for category:', category.id, itemsError);
            return {
              ...category,
              total_items: 0,
              available_items: 0,
              unavailable_items: 0,
              featured_items: 0,
            };
          }

          const total_items = itemsData?.length || 0;
          const available_items = itemsData?.filter(item => item.is_available).length || 0;
          const unavailable_items = total_items - available_items;
          const featured_items = itemsData?.filter(item => item.is_featured).length || 0;

          return {
            ...category,
            total_items,
            available_items,
            unavailable_items,
            featured_items,
          };
        })
      );

      setCategories(categoryStats);
    } catch (error: any) {
      console.error('Error fetching category stats:', error);
      toast.error('Failed to load category statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchCategoryStats();
    }
  }, [vendorId, refreshTrigger]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
          <p className="text-muted-foreground">
            Create menu categories to organize your items better.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Category Overview</h3>
        <div className="text-sm text-muted-foreground">
          {categories.length} {categories.length === 1 ? 'category' : 'categories'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {category.name}
                    {category.is_featured && (
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    )}
                  </CardTitle>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
                {category.image_url && (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-12 h-12 rounded-lg object-cover ml-3"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Total Items */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Total Items
                  </span>
                  <Badge variant="outline">{category.total_items}</Badge>
                </div>

                {/* Availability Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4 text-green-500" />
                      Available
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {category.available_items}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-red-500" />
                      Unavailable
                    </span>
                    <span className="text-sm font-medium text-red-600">
                      {category.unavailable_items}
                    </span>
                  </div>
                </div>

                {/* Featured Items */}
                {category.featured_items > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      Featured Items
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {category.featured_items}
                    </Badge>
                  </div>
                )}

                {/* Availability Progress */}
                {category.total_items > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Availability</span>
                      <span>
                        {Math.round((category.available_items / category.total_items) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{
                          width: `${(category.available_items / category.total_items) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MenuCategoriesTab;