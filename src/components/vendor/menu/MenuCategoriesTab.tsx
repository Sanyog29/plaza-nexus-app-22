import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Package, TrendingUp, Eye, EyeOff, Plus, Edit, Trash2 } from 'lucide-react';
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryStats | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    is_featured: false,
    display_order: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleAddCategory = () => {
    setCategoryForm({
      name: '',
      description: '',
      is_featured: false,
      display_order: categories.length
    });
    setEditingCategory(null);
    setShowAddDialog(true);
  };

  const handleEditCategory = (category: CategoryStats) => {
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      is_featured: category.is_featured,
      display_order: category.display_order
    });
    setEditingCategory(category);
    setShowAddDialog(true);
  };

  const handleSubmitCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoryData = {
        vendor_id: vendorId,
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim() || null,
        is_featured: categoryForm.is_featured,
        display_order: categoryForm.display_order
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('cafeteria_menu_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('cafeteria_menu_categories')
          .insert([categoryData]);
        
        if (error) throw error;
        toast.success('Category created successfully');
      }

      setShowAddDialog(false);
      fetchCategoryStats();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cafeteria_menu_categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
      toast.success('Category deleted successfully');
      fetchCategoryStats();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
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
        <div>
          <h3 className="text-lg font-semibold">Category Management</h3>
          <p className="text-sm text-muted-foreground">
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Category
        </Button>
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
                <div className="flex items-center gap-2 ml-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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

      {/* Add/Edit Category Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingCategory(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Course, Beverages, Desserts"
              />
            </div>
            
            <div>
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="category-featured">Featured Category</Label>
              <Switch
                id="category-featured"
                checked={categoryForm.is_featured}
                onCheckedChange={(checked) => setCategoryForm(prev => ({ ...prev, is_featured: checked }))}
              />
            </div>

            <div>
              <Label htmlFor="display-order">Display Order</Label>
              <Input
                id="display-order"
                type="number"
                value={categoryForm.display_order}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitCategory} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuCategoriesTab;