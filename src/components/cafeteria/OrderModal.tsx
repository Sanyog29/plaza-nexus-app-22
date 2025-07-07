
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { addHours, format } from 'date-fns';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  loyaltyPoints: number;
}

const OrderModal: React.FC<OrderModalProps> = ({ isOpen, onClose, item, loyaltyPoints }) => {
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleOrder = async () => {
    setIsLoading(true);
    try {
      const pickupTime = addHours(new Date(), 1); // Default pickup in 1 hour
      const totalAmount = item.price * quantity;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to place an order",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { data: order, error: orderError } = await supabase
        .from('cafeteria_orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          pickup_time: pickupTime.toISOString(),
        })
        .select()
        .maybeSingle();

      if (orderError) throw orderError;

      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          item_id: item.id,
          quantity,
          unit_price: item.price,
          notes,
        });

      if (itemError) throw itemError;

      toast({
        title: "Order placed successfully!",
        description: `Pickup time: ${format(pickupTime, 'h:mm a')}`,
      });
      onClose();
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error placing order",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place Order - {item?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span>Price: ${item?.price}</span>
            <span className="text-plaza-blue">Points: {loyaltyPoints}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </Button>
            <span>{quantity}</span>
            <Button 
              variant="outline" 
              onClick={() => setQuantity(quantity + 1)}
            >
              +
            </Button>
          </div>

          <textarea
            className="w-full p-2 border rounded-md bg-background"
            placeholder="Special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>${(item?.price * quantity).toFixed(2)}</span>
          </div>

          <Button 
            className="w-full"
            onClick={handleOrder}
            disabled={isLoading}
          >
            {isLoading ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
