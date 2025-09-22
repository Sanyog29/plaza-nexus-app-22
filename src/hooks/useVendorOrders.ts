import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface OrderItem {
  item_id: string;
  quantity: number;
  unit_price: number;
  special_instructions?: string;
}

interface CreateOrderData {
  vendor_id: string;
  total_amount: number;
  service_type: 'dine-in' | 'takeaway' | 'delivery';
  table_number?: string;
  items: OrderItem[];
  customer_instructions?: string;
  status?: 'pending' | 'completed';
  payment_status?: 'pending' | 'paid';
}

export const useCreateOrder = () => {
  const { toast } = useToast();
  const { withErrorHandling } = useErrorHandler();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      return withErrorHandling(async () => {
        // Set pickup time based on service type
        const pickupTime = new Date();
        pickupTime.setMinutes(pickupTime.getMinutes() + 15); // Default 15 minutes from now

        // Create the order
        const { data: order, error: orderError } = await supabase
          .from('cafeteria_orders')
          .insert({
            vendor_id: orderData.vendor_id,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            total_amount: orderData.total_amount,
            service_type: orderData.service_type,
            table_number: orderData.table_number,
            customer_instructions: orderData.customer_instructions,
            pickup_time: pickupTime.toISOString(),
            status: orderData.status || 'pending',
            payment_status: orderData.payment_status || 'pending'
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          item_id: item.item_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          special_instructions: item.special_instructions
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        return order;
      }, { context: 'creating_vendor_order' });
    },
    onSuccess: (order) => {
      const isCompleted = order?.status === 'completed';
      toast({
        title: isCompleted ? "Sale Completed Successfully" : "Order Created Successfully",
        description: isCompleted ? 
          `Sale #${order?.id?.slice(-6)} has been processed` :
          `Order #${order?.id?.slice(-6)} has been placed`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
    },
  });
};