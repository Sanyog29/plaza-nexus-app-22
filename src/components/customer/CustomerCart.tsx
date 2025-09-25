import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { EnhancedPaymentModal } from '@/components/vendor/EnhancedPaymentModal';
import { useCreateOrder } from '@/hooks/useVendorOrders';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

export const CustomerCart: React.FC = () => {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const createOrderMutation = useCreateOrder();

  const formatPrice = (price: number) => `₹${price.toFixed(0)}`;

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error("Please login to place an order");
      return;
    }

    if (cart.items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!cart.vendor_id || !user) return;

    const orderData = {
      vendor_id: cart.vendor_id,
      user_id: user.id,
      total_amount: cart.total,
      service_type: 'takeaway' as const,
      items: cart.items.map(item => ({
        item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      })),
    };

    try {
      await createOrderMutation.mutateAsync(orderData);
      clearCart();
      setIsPaymentModalOpen(false);
      toast.success("Order placed successfully!");
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error("Failed to place order. Please try again.");
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
        <p className="text-muted-foreground">
          Add some delicious items to get started!
        </p>
      </div>
    );
  }

  const deliveryFee = 0; // You can add delivery fee logic here
  const finalTotal = cart.total + deliveryFee;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Order</span>
            <Badge variant="outline">
              {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          {cart.vendor_name && (
            <p className="text-sm text-muted-foreground">from {cart.vendor_name}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.items.map(item => (
            <div key={item.id} className="flex flex-wrap items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
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

              <div className="flex-1 min-w-0">
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatPrice(item.price)} each
                </p>
                {item.dietary_tags && item.dietary_tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {item.dietary_tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="h-8 w-8 p-0"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock_quantity}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveItem(item.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-right ml-auto">
                <div className="font-medium whitespace-nowrap">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{formatPrice(finalTotal)}</span>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={clearCart} className="flex-1">
              Clear Cart
            </Button>
            <Button onClick={handleCheckout} className="flex-1" size="lg">
              Proceed to Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {cart.vendor_id && (
        <EnhancedPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          cartItems={cart.items}
          subtotal={cart.total}
          discount={0}
          total={finalTotal}
          orderType="takeaway"
          onPaymentSuccess={handlePaymentSuccess}
          vendorId={cart.vendor_id}
        />
      )}
    </div>
  );
};