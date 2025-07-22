import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Upload } from 'lucide-react';
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
    dietary_tags: initialData?.dietary_tags || [],
    allergens: initialData?.allergens || [],
    ingredients: initialData?.ingredients || [],
    nutritional_info: initialData?.nutritional_info || {
      calories: '',
      protein: '',
      carbs: '',
      fat: ''
    }
  });

  const [newTag, setNewTag] = useState('');
  const [newAllergen, setNewAllergen] = useState('');
  const [newIngredient, setNewIngredient] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const commonDietaryTags = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Low-Carb', 'High-Protein'];
  const commonAllergens = ['Nuts', 'Dairy', 'Eggs', 'Soy', 'Wheat', 'Shellfish', 'Fish'];

  const addTag = (type: 'dietary_tags' | 'allergens' | 'ingredients', value: string) => {
    if (value && !formData[type].includes(value)) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], value]
      }));
    }
  };

  const removeTag = (type: 'dietary_tags' | 'allergens' | 'ingredients', value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((item: string) => item !== value)
    }));
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
        dietary_tags: formData.dietary_tags,
        allergens: formData.allergens,
        ingredients: formData.ingredients,
        image_url: imageUrl,
        nutritional_info: {
          calories: formData.nutritional_info.calories ? parseInt(formData.nutritional_info.calories) : null,
          protein: formData.nutritional_info.protein ? parseFloat(formData.nutritional_info.protein) : null,
          carbs: formData.nutritional_info.carbs ? parseFloat(formData.nutritional_info.carbs) : null,
          fat: formData.nutritional_info.fat ? parseFloat(formData.nutritional_info.fat) : null
        }
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

        {/* Dietary Information */}
        <Card>
          <CardHeader>
            <CardTitle>Dietary Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Dietary Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.dietary_tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag('dietary_tags', tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add dietary tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('dietary_tags', newTag);
                      setNewTag('');
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    addTag('dietary_tags', newTag);
                    setNewTag('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonDietaryTags.map(tag => (
                  <Button
                    key={tag}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag('dietary_tags', tag)}
                    disabled={formData.dietary_tags.includes(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Allergens</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.allergens.map((allergen: string) => (
                  <Badge key={allergen} variant="destructive" className="flex items-center gap-1">
                    {allergen}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag('allergens', allergen)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add allergen"
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('allergens', newAllergen);
                      setNewAllergen('');
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    addTag('allergens', newAllergen);
                    setNewAllergen('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {commonAllergens.map(allergen => (
                  <Button
                    key={allergen}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTag('allergens', allergen)}
                    disabled={formData.allergens.includes(allergen)}
                  >
                    {allergen}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutritional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Nutritional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={formData.nutritional_info.calories}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutritional_info: { ...prev.nutritional_info, calories: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  value={formData.nutritional_info.protein}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutritional_info: { ...prev.nutritional_info, protein: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  value={formData.nutritional_info.carbs}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutritional_info: { ...prev.nutritional_info, carbs: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="fat">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  value={formData.nutritional_info.fat}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    nutritional_info: { ...prev.nutritional_info, fat: e.target.value }
                  }))}
                />
              </div>
            </div>

            <div>
              <Label>Ingredients</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.ingredients.map((ingredient: string) => (
                  <Badge key={ingredient} variant="outline" className="flex items-center gap-1">
                    {ingredient}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag('ingredients', ingredient)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add ingredient"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('ingredients', newIngredient);
                      setNewIngredient('');
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    addTag('ingredients', newIngredient);
                    setNewIngredient('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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
    </form>
  );
};

export default MenuItemForm;