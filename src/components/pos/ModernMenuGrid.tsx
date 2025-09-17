import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Search, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
interface MenuItem {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  available: boolean;
  category_id?: string;
  description?: string;
  rating?: number;
}
interface MenuCategory {
  id: string;
  name: string;
  display_order?: number;
}
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image_url?: string;
}
interface ModernMenuGridProps {
  onAddToCart: (item: CartItem) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  cartItems: CartItem[];
  vendorId: string;
  selectedCategory: string;
}
export const ModernMenuGrid: React.FC<ModernMenuGridProps> = ({
  onAddToCart,
  onUpdateQuantity,
  cartItems,
  vendorId,
  selectedCategory
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchMenuData();
  }, [vendorId]);
  const fetchMenuData = async () => {
    try {
      setLoading(true);

      // Fetch real categories from database
      const {
        data: categoriesData,
        error: categoriesError
      } = await supabase.from('cafeteria_menu_categories').select('id, name, display_order').eq('vendor_id', vendorId).order('display_order', {
        ascending: true
      });
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      // Fetch real menu items from database
      const {
        data: menuItemsData,
        error: menuItemsError
      } = await supabase.from('vendor_menu_items').select('id, name, price, description, image_url, is_available, category_id, average_rating').eq('vendor_id', vendorId).eq('is_available', true).order('name', {
        ascending: true
      });
      if (menuItemsError) {
        console.error('Error fetching menu items:', menuItemsError);
        throw menuItemsError;
      }

      // Transform the data to match our interface
      const transformedCategories: MenuCategory[] = (categoriesData || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        display_order: cat.display_order
      }));
      const transformedMenuItems: MenuItem[] = (menuItemsData || []).map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        available: item.is_available ?? true,
        category_id: item.category_id,
        description: item.description,
        image_url: item.image_url,
        rating: item.average_rating ? Number(item.average_rating) : undefined
      }));
      setCategories(transformedCategories);
      setMenuItems(transformedMenuItems);
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getFilteredItems = () => {
    let filtered = menuItems;

    // Filter by category
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category_id === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.description?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return filtered;
  };
  const getItemQuantityInCart = (itemId: string): number => {
    const cartItem = cartItems.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };
  const handleAddToCart = (item: MenuItem) => {
    if (!item.available) {
      toast({
        title: "Item Unavailable",
        description: "This item is currently not available.",
        variant: "destructive"
      });
      return;
    }
    const cartItem: CartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image_url: item.image_url
    };
    onAddToCart(cartItem);
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart.`
    });
  };
  const handleRemoveFromCart = (itemId: string) => {
    const currentQuantity = getItemQuantityInCart(itemId);
    if (currentQuantity > 0) {
      onUpdateQuantity(itemId, currentQuantity - 1);
    }
  };
  const handleIncreaseQuantity = (itemId: string) => {
    const currentQuantity = getItemQuantityInCart(itemId);
    onUpdateQuantity(itemId, currentQuantity + 1);
  };
  const filteredItems = getFilteredItems();
  if (loading) {
    return <div className="flex-1 bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading menu items...</p>
        </div>
      </div>;
  }
  return <div className="min-w-[880px] flex-shrink-0 min-h-0 overflow-y-auto bg-background">
      {/* Search Bar */}
      <div className="p-4 border-b border-border px-[16px] py-[16px] mx-[5px]">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="text" placeholder="Search menu items..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="p-4">
        {filteredItems.length === 0 ? <div className="text-center py-12">
            <h3 className="text-lg font-medium text-foreground">No items found</h3>
            <p className="text-muted-foreground mt-2">
              {searchTerm ? "Try adjusting your search" : "No items available in this category"}
            </p>
          </div> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredItems.map(item => {
          const quantityInCart = getItemQuantityInCart(item.id);
          return <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                  <div className="aspect-square relative overflow-hidden">
                    {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No Image</span>
                      </div>}
                    
                    {/* Rating Badge */}
                    {item.rating && item.rating > 0 && <Badge className="absolute top-2 left-2 bg-card text-card-foreground">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {item.rating.toFixed(1)}
                      </Badge>}
                    
                    {/* Availability Badge */}
                    <Badge variant={item.available ? "default" : "destructive"} className="absolute top-2 right-2">
                      {item.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground text-sm leading-tight">
                        {item.name}
                      </h3>
                      
                      {item.description && <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          ₹{item.price.toFixed(0)}
                        </span>
                      </div>
                      
                      {/* Cart Controls */}
                      <div className="pt-2">
                        {quantityInCart === 0 ? <Button onClick={() => handleAddToCart(item)} disabled={!item.available} className="w-full" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add to Cart
                          </Button> : <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleRemoveFromCart(item.id)} className="flex-1">
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-3 py-2 bg-muted rounded text-sm font-medium">
                              {quantityInCart}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => handleIncreaseQuantity(item.id)} className="flex-1">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>;
        })}
          </div>}
      </div>
    </div>;
};