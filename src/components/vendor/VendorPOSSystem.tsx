import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ShoppingCart, Plus, Minus, X, RefreshCw, Search, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useVendorMenuCategories, useVendorMenuItems } from '@/hooks/useVendorMenu';
import { useCreateOrder } from '@/hooks/useVendorOrders';
import { Database } from '@/integrations/supabase/types';
import { EnhancedPaymentModal } from './EnhancedPaymentModal';
type MenuCategory = Database['public']['Tables']['cafeteria_menu_categories']['Row'];
type MenuItem = Database['public']['Tables']['vendor_menu_items']['Row'];
interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

// Remove mock data - using real database data now

interface VendorPOSSystemProps {
  vendorId: string;
}
export const VendorPOSSystem: React.FC<VendorPOSSystemProps> = ({
  vendorId
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch vendor data
  const {
    data: categories = [],
    isLoading: categoriesLoading
  } = useVendorMenuCategories(vendorId);
  const {
    data: menuItems = [],
    isLoading: itemsLoading
  } = useVendorMenuItems(vendorId);
  const {
    mutate: createOrder,
    isPending: isCreatingOrder
  } = useCreateOrder();

  // Process categories with counts
  const categoriesWithCounts = useMemo(() => {
    const allCategory = {
      id: 'all',
      name: 'All',
      count: menuItems.length
    };
    const categoryList = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: menuItems.filter(item => item.category_id === cat.id).length
    }));
    return [allCategory, ...categoryList];
  }, [categories, menuItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.category_id === activeCategory;
      const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);
  const isLoading = categoriesLoading || itemsLoading;
  const addToCart = (menuItem: MenuItem) => {
    if (!menuItem.is_available) {
      toast.error("Item unavailable", { 
        description: `${menuItem.name} is currently not available` 
      });
      return;
    }
    
    setCart(prev => {
      const existingItem = prev.find(item => item.id === menuItem.id);
      if (existingItem) {
        toast.success("Cart updated!", { 
          description: `${menuItem.name} x${existingItem.quantity + 1}` 
        });
        return prev.map(item => item.id === menuItem.id ? {
          ...item,
          quantity: item.quantity + 1
        } : item);
      }
      toast.success("Added to cart!", { 
        description: `${menuItem.name} x1` 
      });
      return [...prev, {
        ...menuItem,
        quantity: 1
      }];
    });
  };
  const updateQuantity = (id: string, quantity: number) => {
    const item = cart.find(cartItem => cartItem.id === id);
    if (quantity === 0) {
      toast.error("Item removed", { 
        description: `${item?.name} removed from cart` 
      });
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      toast.info("Cart updated", { 
        description: `${item?.name} x${quantity}` 
      });
      setCart(prev => prev.map(item => item.id === id ? {
        ...item,
        quantity
      } : item));
    }
  };
  const clearCart = () => setCart([]);
  const handleConfirmPayment = () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };
  const handlePaymentSuccess = () => {
    const orderItems = cart.map(item => ({
      item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price || 0,
      special_instructions: item.notes
    }));
    createOrder({
      vendor_id: vendorId,
      total_amount: total,
      service_type: orderType,
      table_number: orderType === 'dine-in' ? tableNumber : undefined,
      items: orderItems
    }, {
      onSuccess: () => {
        clearCart();
        setTableNumber('');
        setShowPaymentModal(false);
      }
    });
  };
  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  const discount = subtotal > 500 ? subtotal * 0.05 : 0; // 5% discount on orders above ₹500
  const total = subtotal - discount;
  return <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b p-2 md:p-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-4">
            <div>
              <h1 className="text-lg md:text-xl font-semibold">POS System</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                  Live
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="flex-shrink-0">
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search Menu" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-sm w-full sm:w-48 md:w-64" />
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1 md:gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {isLoading ? <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading categories...</span>
            </div> : categoriesWithCounts.map(category => <button key={category.id} onClick={() => setActiveCategory(category.id)} className={cn("flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-lg whitespace-nowrap transition-colors flex-shrink-0 text-sm", activeCategory === category.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")}>
                <span className="text-xs md:text-sm">{category.name}</span>
                <Badge variant="secondary" className="text-xs h-4">
                  {category.count}
                </Badge>
              </button>)}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-hidden">
        <div className="flex-1 p-2 md:p-4 overflow-y-auto order-2 lg:order-1">
          {isLoading ? <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-muted-foreground">Loading menu items...</p>
              </div>
            </div> : filteredItems.length === 0 ? <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No items found</p>
              </div>
            </div> : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
              {filteredItems.map(item => <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'} alt={item.name || 'Menu item'} className="w-full h-32 object-cover" />
                    <Badge className={cn("absolute top-2 right-2 text-xs", item.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                      {item.is_available ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-primary">₹{(item.price || 0).toFixed(2)}</span>
                      <Button 
                        size="sm" 
                        onClick={() => addToCart(item)} 
                        disabled={!item.is_available} 
                        className={cn(
                          "h-7 px-2 text-xs flex-shrink-0 transition-all duration-200 hover:scale-105 active:scale-95", 
                          !item.is_available && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </div>

        {/* Order Summary - Mobile: Expandable, Desktop: Right sidebar */}
        <div className="w-full lg:w-80 bg-card border-t lg:border-t-0 lg:border-l flex flex-col flex-shrink-0 order-1 lg:order-2 lg:max-h-none">
          <div className="p-2 md:p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base md:text-lg">Order Summary</h2>
                {cart.length > 0 && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 animate-pulse">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="text-xs">#B{Math.floor(Math.random() * 99999)}</Badge>
            </div>
          </div>

          <ScrollArea className="flex-1 p-2 md:p-4">
            {cart.length === 0 ? <div className="text-center text-muted-foreground py-8">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No items in cart</p>
              </div> : <div className="space-y-3">
                {cart.map(item => <div key={item.id} className="flex gap-2 p-2 bg-muted/30 rounded-lg">
                    <img src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'} alt={item.name || 'Menu item'} className="w-10 h-10 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs">{item.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-semibold text-xs">₹{((item.price || 0) * item.quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" className="h-5 w-5 p-0" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="w-2 h-2" />
                          </Button>
                          <span className="text-xs w-6 text-center">{item.quantity}</span>
                          <Button size="sm" variant="outline" className="h-5 w-5 p-0" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="w-2 h-2" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-red-500 hover:text-red-600" onClick={() => updateQuantity(item.id, 0)}>
                            <X className="w-2 h-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>)}
              </div>}
          </ScrollArea>

          {/* Order Totals */}
          {cart.length > 0 && <div className="p-3 border-t space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="transition-all duration-300">₹{subtotal.toFixed(2)}</span>
                </div>
                
                {discount > 0 && <div className="flex justify-between text-green-600 animate-fade-in">
                    <span>Discount (5%)</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>}
                <Separator />
                <div className="flex justify-between font-semibold text-sm">
                  <span>Total Payment</span>
                  <span className="text-primary transition-all duration-300">₹{total.toFixed(2)}</span>
                </div>
              </div>

              

              <div className="space-y-1">
                <Button variant="outline" className="w-full h-8 text-xs" onClick={clearCart} disabled={isCreatingOrder}>
                  Clear Cart
                </Button>
                <Button className="w-full h-8 text-xs bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transform hover:scale-105 transition-all duration-200" onClick={handleConfirmPayment} disabled={isCreatingOrder}>
                  {isCreatingOrder ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Clock className="w-3 h-3 mr-1" />}
                  {isCreatingOrder ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </div>
            </div>}
        </div>
      </div>
      
      {/* Enhanced Payment Modal */}
      <EnhancedPaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} cartItems={cart.map(item => ({
      id: item.id,
      name: item.name || 'Item',
      price: item.price || 0,
      quantity: item.quantity
    }))} subtotal={subtotal} discount={discount} total={total} onPaymentSuccess={handlePaymentSuccess} orderType={orderType} tableNumber={tableNumber} />
    </div>;
};