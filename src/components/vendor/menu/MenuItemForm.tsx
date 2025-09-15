import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MenuItemFormProps {
  vendorId: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

const MenuItemForm: React.FC<MenuItemFormProps> = ({
  vendorId,
  onSuccess,
  onCancel,
  initialData
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    price: initialData?.price || '',
    cost_price: initialData?.cost_price || '',
    stock_quantity: initialData?.stock_quantity || '',
    low_stock_threshold: initialData?.low_stock_threshold || '5',
    preparation_time_minutes: initialData?.preparation_time_minutes || '15',
    spice_level: initialData?.spice_level || '0',
    is_available: initialData?.is_available ?? true,
    is_featured: initialData?.is_featured || false,
    category_id: initialData?.category_id || ''
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    description: ''
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('cafeteria_menu_categories')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('display_order');
      
      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }
      
      setCategories(data || []);
    };
    
    fetchCategories();
  }, [vendorId]);

  const handleAddNewCategory = async () => {
    if (!newCategoryForm.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cafeteria_menu_categories')
        .insert([{
          vendor_id: vendorId,
          name: newCategoryForm.name.trim(),
          description: newCategoryForm.description.trim() || null,
          display_order: categories.length
        }])
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setFormData(prev => ({ ...prev, category_id: data.id }));
      setShowAddCategoryDialog(false);
      setNewCategoryForm({ name: '', description: '' });
      
      toast({
        title: "Success",
        description: "Category created successfully"
      });
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive"
      });
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = initialData?.image_url;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `menu-items/${vendorId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vendor-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('vendor-images')
          .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
      }

      const menuItemData = {
        vendor_id: vendorId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
        preparation_time_minutes: parseInt(formData.preparation_time_minutes) || 15,
        spice_level: parseInt(formData.spice_level) || 0,
        is_available: formData.is_available,
        is_featured: formData.is_featured,
        category_id: formData.category_id || null,
        image_url: imageUrl
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('vendor_menu_items')
          .update(menuItemData)
          .eq('id', initialData.id);

        if (error) throw error;
        toast({ title: "Menu item updated successfully!" });
      } else {
        const { error } = await supabase
          .from('vendor_menu_items')
          .insert([menuItemData]);

        if (error) throw error;
        toast({ title: "Menu item created successfully!" });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving menu item:', error);
      toast({
        title: "Error saving menu item",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Selling Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cost_price">Cost Price</Label>
                <Input
                  id="cost_price"
                  type="number"
                  step="0.01"
                  value={formData.cost_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prep_time">Prep Time (min)</Label>
                <Input
                  id="prep_time"
                  type="number"
                  value={formData.preparation_time_minutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, preparation_time_minutes: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="spice_level">Spice Level (0-5)</Label>
                <Select
                  value={formData.spice_level.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, spice_level: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        {level} {level === 0 ? '(Mild)' : level === 5 ? '(Very Hot)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock & Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Stock & Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  value={formData.low_stock_threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_available">Available for Orders</Label>
              <Switch
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_featured">Featured Item</Label>
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
            </div>

            <div>
              <Label htmlFor="image">Item Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Menu Category *</Label>
              <div className="flex gap-2">
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="hover:bg-muted">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCategoryDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New
                </Button>
              </div>
              {categories.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  No categories found. Create your first category using the "Add New" button.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : initialData ? 'Update Item' : 'Create Item'}
        </Button>
      </div>

      {/* Add New Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-category-name">Category Name *</Label>
              <Input
                id="new-category-name"
                value={newCategoryForm.name}
                onChange={(e) => setNewCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Main Course, Beverages, Desserts"
              />
            </div>
            
            <div>
              <Label htmlFor="new-category-description">Description</Label>
              <Textarea
                id="new-category-description"
                value={newCategoryForm.description}
                onChange={(e) => setNewCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddCategoryDialog(false);
                setNewCategoryForm({ name: '', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNewCategory}>
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};

export default MenuItemForm;