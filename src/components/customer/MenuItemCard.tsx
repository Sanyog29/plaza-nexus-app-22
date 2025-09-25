import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Star, Trash2 } from 'lucide-react';
import { useCart, CartItem } from '@/contexts/CartContext';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  dietary_tags?: string[];
  is_available: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  average_rating?: number;
  spice_level?: number;
  preparation_time_minutes?: number;
  vendor_id: string;
}

interface MenuItemCardProps {
  item: MenuItem;
  vendorName: string;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, vendorName }) => {
  const { cart, addItem, updateQuantity } = useCart();
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = item.stock_quantity <= item.low_stock_threshold;
  const isLowStock = item.stock_quantity <= item.low_stock_threshold * 2;
  
  // Find existing item in cart
  const cartItem = cart.items.find(cartItem => cartItem.id === item.id);
  const cartQuantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    const cartItemData: CartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: quantity,
      image_url: item.image_url,
      vendor_id: item.vendor_id,
      dietary_tags: item.dietary_tags,
      stock_quantity: item.stock_quantity,
      low_stock_threshold: item.low_stock_threshold,
    };

    addItem(cartItemData, vendorName);
    setQuantity(1); // Reset quantity after adding
  };

  const handleUpdateCartQuantity = (newQuantity: number) => {
    if (newQuantity === 0) {
      updateQuantity(item.id, 0); // This will remove the item
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  const formatPrice = (price: number) => `₹${price.toFixed(0)}`;

  const getDietaryColor = (tag: string) => {
    switch (tag?.toLowerCase()) {
      case 'vegetarian': return 'success';
      case 'vegan': return 'success';
      case 'non-vegetarian': return 'destructive';
      case 'spicy': return 'destructive';
      case 'gluten-free': return 'secondary';
      default: return 'outline';
    }
  };

  const getSpiceLevelText = (level?: number) => {
    if (!level) return null;
    if (level <= 1) return '🌶️ Mild';
    if (level <= 2) return '🌶️🌶️ Medium';
    return '🌶️🌶️🌶️ Spicy';
  };

  return (
    <Card className={`group overflow-hidden transition-all duration-200 ${!item.is_available || isOutOfStock ? 'opacity-60' : 'hover:shadow-md'}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Item Image */}
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <span className="text-lg">🍽️</span>
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base truncate">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="text-right ml-2">
                <div className="font-bold text-lg whitespace-nowrap">{formatPrice(item.price)}</div>
                {(item.average_rating ?? 0) > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{item.average_rating!.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags and Info */}
            <div className="flex flex-wrap gap-1 mb-3">
              {item.dietary_tags?.map(tag => (
                <Badge
                  key={tag}
                  variant={getDietaryColor(tag) as any}
                  className="text-xs px-2 py-0"
                >
                  {tag}
                </Badge>
              ))}
              
              {getSpiceLevelText(item.spice_level) && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  {getSpiceLevelText(item.spice_level)}
                </Badge>
              )}
              
              {item.preparation_time_minutes && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  {item.preparation_time_minutes} mins
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {cartItem ? (
                <>
                  <div className="flex items-center border rounded-md shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateCartQuantity(cartItem.quantity - 1)}
                      disabled={cartItem.quantity <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-3 py-1 text-sm font-medium">
                      {cartItem.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateCartQuantity(cartItem.quantity + 1)}
                      disabled={cartItem.quantity >= (item.stock_quantity || 999)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, 0)}
                    className="text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || !item.is_available}
                  className="flex-1 min-w-[140px] sm:min-w-[120px]"
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add to Cart
                </Button>
              )}
              {(isOutOfStock || !item.is_available) && (
                <Button size="sm" disabled className="w-full">
                  {isOutOfStock ? 'Out of Stock' : 'Not Available'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};