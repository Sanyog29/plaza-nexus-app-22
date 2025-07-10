
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { addHours, format } from 'date-fns';
import { UPIPaymentModal } from './UPIPaymentModal';

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
  const [showPayment, setShowPayment] = React.useState(false);
  const [orderId, setOrderId] = React.useState<string>('');
  const [orderItems, setOrderItems] = React.useState<Array<{ name: string; quantity: number; price: number }>>([]);
  const { toast } = useToast();

  const handleOrder = async () => {
    setIsLoading(true);
    try {
      const pickupTime = addHours(new Date(), 1);
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
          status: 'pending_payment'
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

      // Prepare for payment
      setOrderId(order.id);
      setOrderItems([{ 
        name: item.name, 
        quantity, 
        price: item.price 
      }]);
      setShowPayment(true);
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

  const handlePaymentSuccess = async () => {
    try {
      // Update order status to confirmed
      await supabase
        .from('cafeteria_orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      setShowPayment(false);
      onClose();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showPayment} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Place Order - {item?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span>Price: ₹{item?.price}</span>
              <span className="text-primary">Points: {loyaltyPoints}</span>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                -
              </Button>
              <span className="px-4 py-2 bg-muted rounded">{quantity}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>

            <textarea
              className="w-full p-3 border rounded-md bg-background resize-none"
              placeholder="Special instructions (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            <div className="flex justify-between items-center p-3 bg-muted rounded-md">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg">₹{(item?.price * quantity).toFixed(2)}</span>
            </div>

            <Button 
              className="w-full"
              onClick={handleOrder}
              disabled={isLoading}
              size="lg"
            >
              {isLoading ? "Processing..." : "Proceed to Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <UPIPaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        orderId={orderId}
        amount={item?.price * quantity}
        items={orderItems}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default OrderModal;
