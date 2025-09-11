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
  cartItems: CartItem[];
}

export const MenuGrid: React.FC<MenuGridProps> = ({ onAddToCart, cartItems }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMenuData();
  }, []);

  const fetchMenuData = async () => {
    try {
      // Try to fetch from database first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('cafeteria_menu_categories')
        .select('*')
        .order('display_order');

      const { data: itemsData, error: itemsError } = await supabase
        .from('cafeteria_menu_items')
        .select('*');

      // Use database data if available, otherwise fall back to mock data
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

  const getCategoryItemCount = (categoryId: string) => {
    if (categoryId === 'all') return menuItems.length;
    return menuItems.filter(item => item.category_id === categoryId).length;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      {/* Category Tabs */}
      <div className="flex space-x-1 mb-6 border-b">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            selectedCategory === 'all'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          All <span className="ml-1 text-sm">({getCategoryItemCount('all')})</span>
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              selectedCategory === category.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {category.name} <span className="ml-1 text-sm">({getCategoryItemCount(category.id)})</span>
          </button>
        ))}
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {getFilteredItems().map((item) => {
          const quantityInCart = getItemQuantityInCart(item.id);
          
          return (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative">
                <img
                  src={item.image_url || '/placeholder.svg'}
                  alt={item.name}
                  className="w-full h-32 object-cover"
                />
                <Badge 
                  className={`absolute top-2 right-2 ${
                    item.is_available 
                      ? 'bg-green-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {item.is_available ? 'Available' : 'Not Available'}
                </Badge>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                <p className="text-xl font-bold mb-3">${item.price.toFixed(2)}</p>
                
                {quantityInCart > 0 ? (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Remove one from cart (you'll need to implement this)
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <span className="font-medium">Add More ({quantityInCart})</span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.is_available}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={() => handleAddToCart(item)}
                    disabled={!item.is_available}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};