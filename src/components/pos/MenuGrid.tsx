import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { mockMenuCategories, mockMenuItems } from './POSMockData';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  category_id: string | null;
}

interface MenuCategory {
  id: string;
  name: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface MenuGridProps {
  onAddToCart: (item: CartItem) => void;
  onUpdateQuantity?: (itemId: string, newQuantity: number) => void;
  cartItems: CartItem[];
  vendorId?: string;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ onAddToCart, onUpdateQuantity, cartItems, vendorId }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMenuData();
  }, [vendorId]);

  const fetchMenuData = async () => {
    try {
      if (vendorId) {
        // Fetch from vendor_menu_items for vendor-specific POS
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('cafeteria_menu_categories')
          .select('*')
          .eq('vendor_id', vendorId)
          .order('display_order');

        const { data: itemsData, error: itemsError } = await supabase
          .from('vendor_menu_items')
          .select('*')
          .eq('vendor_id', vendorId)
          .eq('is_active', true);

        if (!categoriesError && categoriesData) {
          setCategories(categoriesData);
        } else {
          setCategories(mockMenuCategories);
        }

        if (!itemsError && itemsData) {
          setMenuItems(itemsData);
        } else {
          setMenuItems(mockMenuItems);
        }
      } else {
        // Fallback to all available items from all vendors
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('cafeteria_menu_categories')
          .select('*')
          .order('display_order');

        const { data: itemsData, error: itemsError } = await supabase
          .from('vendor_menu_items')
          .select('*')
          .eq('is_active', true)
          .eq('is_available', true);

        if (!categoriesError && categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData);
        } else {
          setCategories(mockMenuCategories);
        }

        if (!itemsError && itemsData && itemsData.length > 0) {
          setMenuItems(itemsData);
        } else {
          setMenuItems(mockMenuItems);
        }
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
      // Fallback to mock data on error
      setCategories(mockMenuCategories);
      setMenuItems(mockMenuItems);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    if (selectedCategory === 'all') return menuItems;
    return menuItems.filter(item => item.category_id === selectedCategory);
  };

  const getItemQuantityInCart = (itemId: string) => {
    const cartItem = cartItems.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = (item: MenuItem) => {
    if (!item.is_available) {
      toast({
        title: "Item Unavailable",
        description: `${item.name} is currently not available`,
        variant: "destructive",
      });
      return;
    }

    onAddToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    const currentQuantity = getItemQuantityInCart(itemId);
    if (currentQuantity > 0 && onUpdateQuantity) {
      onUpdateQuantity(itemId, Math.max(0, currentQuantity - 1));
    }
  };

  const getCategoryItemCount = (categoryId: string) => {
    if (categoryId === 'all') return menuItems.length;
    return menuItems.filter(item => item.category_id === categoryId).length;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Category Tabs - Enhanced Pospay Style */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-muted rounded-lg">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background'
          }`}
        >
          All Items
          <Badge variant="secondary" className="text-xs">
            {getCategoryItemCount('all')}
          </Badge>
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            {category.name}
            <Badge variant="secondary" className="text-xs">
              {getCategoryItemCount(category.id)}
            </Badge>
          </button>
        ))}
      </div>

      {/* Menu Items Grid - Enhanced Pospay Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {getFilteredItems().map((item) => {
          const quantityInCart = getItemQuantityInCart(item.id);
          
          return (
            <Card key={item.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <img
                  src={item.image_url || '/placeholder.svg'}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                <Badge 
                  variant={item.is_available ? 'secondary' : 'destructive'}
                  className="absolute top-3 right-3 shadow-sm"
                >
                  {item.is_available ? 'Available' : 'Unavailable'}
                </Badge>
                
                {item.is_featured && (
                  <Badge 
                    variant="default" 
                    className="absolute top-3 left-3 bg-orange-500 hover:bg-orange-600"
                  >
                    Featured
                  </Badge>
                )}
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg leading-tight line-clamp-2">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">₹{item.price.toFixed(2)}</div>
                  {item.preparation_time_minutes && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>🕒</span>
                      {item.preparation_time_minutes}m
                    </div>
                  )}
                </div>
                
                {quantityInCart > 0 ? (
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFromCart(item.id)}
                      disabled={quantityInCart <= 0}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-medium">In Cart</span>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {quantityInCart}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.is_available}
                      className="h-10 w-10 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full h-11"
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.is_available}
                    variant={item.is_available ? "default" : "secondary"}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {item.is_available ? 'Add to Cart' : 'Not Available'}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      
      {getFilteredItems().length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg">No items found</div>
          <p className="text-sm text-muted-foreground mt-2">
            {selectedCategory === 'all' 
              ? 'No menu items are currently available' 
              : `No items found in ${categories.find(c => c.id === selectedCategory)?.name || 'this category'}`
            }
          </p>
        </div>
      )}
    </div>
  );
};