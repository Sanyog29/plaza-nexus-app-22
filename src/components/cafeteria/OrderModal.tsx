
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { addHours, format } from 'date-fns';
import { EnhancedUPIPaymentModal } from './EnhancedUPIPaymentModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Calendar } from 'lucide-react';

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
  const [orderType, setOrderType] = React.useState<'instant' | 'scheduled'>('instant');
  const [scheduledDate, setScheduledDate] = React.useState('');
  const [scheduledTime, setScheduledTime] = React.useState('');
  const { toast } = useToast();

  const handleOrder = async () => {
    setIsLoading(true);
    try {
      let pickupTime = addHours(new Date(), 1);
      
      // Calculate pickup time based on order type
      if (orderType === 'scheduled' && scheduledDate && scheduledTime) {
        pickupTime = new Date(`${scheduledDate}T${scheduledTime}`);
      }

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

      // Get vendor ID from item
      const vendorId = item.vendor_id || item.vendor?.id;

      const { data: order, error: orderError } = await supabase
        .from('cafeteria_orders')
        .insert({
          user_id: user.id,
          vendor_id: vendorId,
          total_amount: totalAmount,
          pickup_time: pickupTime.toISOString(),
          order_type: orderType,
          is_scheduled: orderType === 'scheduled',
          scheduled_pickup_time: orderType === 'scheduled' ? pickupTime.toISOString() : null,
          customer_instructions: notes,
          preparation_time_minutes: item.preparation_time_minutes || 15,
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
          vendor_item_id: item.id,
          quantity,
          unit_price: item.price,
          special_instructions: notes,
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
            {/* Vendor Info */}
            {item?.vendor && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                {item.vendor.logo_url && (
                  <img 
                    src={item.vendor.logo_url} 
                    alt={item.vendor.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-sm">from {item.vendor.name}</p>
                  <p className="text-xs text-muted-foreground">{item.vendor.cuisine_type}</p>
                </div>
              </div>
            )}

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

            {/* Order Type Selection */}
            <Tabs value={orderType} onValueChange={(value) => setOrderType(value as 'instant' | 'scheduled')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instant" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Order Now
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="instant" className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ready for pickup in {item?.preparation_time_minutes || 15} minutes
                </p>
              </TabsContent>
              
              <TabsContent value="scheduled" className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Schedule your order for later pickup. 5% discount for orders placed 2+ hours in advance.
                </p>
              </TabsContent>
            </Tabs>

            <textarea
              className="w-full p-3 border rounded-md bg-background resize-none"
              placeholder="Special instructions (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />

            <div className="flex justify-between items-center p-3 bg-muted rounded-md">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg">₹{(item?.price * quantity).toFixed(0)}</span>
            </div>

            <Button 
              className="w-full"
              onClick={handleOrder}
              disabled={isLoading || (orderType === 'scheduled' && (!scheduledDate || !scheduledTime))}
              size="lg"
            >
              {isLoading ? "Processing..." : 
               orderType === 'scheduled' ? "Schedule Order" : "Order Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EnhancedUPIPaymentModal
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
