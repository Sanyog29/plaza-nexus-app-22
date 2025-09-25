import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';

interface StickyCartPanelProps {
  onOpenCart?: () => void;
  showCheckout?: boolean;
}

export const StickyCartPanel: React.FC<StickyCartPanelProps> = ({ 
  onOpenCart, 
  showCheckout = true 
}) => {
  const { cart } = useCart();
  const navigate = useNavigate();

  // Don't show if cart is empty
  if (cart.itemCount === 0) return null;

  const handleCartClick = () => {
    if (onOpenCart) {
      onOpenCart();
    } else {
      // Navigate to checkout or open cart modal
      navigate('/cafeteria/cart');
    }
  };

  const formatPrice = (price: number) => `₹${price.toFixed(0)}`;

  return (
    <div className="fixed bottom-[72px] left-4 right-4 z-40 md:bottom-4">
      <Card className="shadow-lg border-2 bg-background">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {cart.itemCount}
                </Badge>
              </div>
              
              <div>
                <div className="font-semibold">
                  {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}
                </div>
                <div className="text-sm text-muted-foreground">
                  from {cart.vendor_name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="font-bold text-lg">
                  {formatPrice(cart.total)}
                </div>
              </div>
              
              {showCheckout && (
                <Button 
                  onClick={handleCartClick}
                  className="flex items-center gap-2"
                >
                  View Cart
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};