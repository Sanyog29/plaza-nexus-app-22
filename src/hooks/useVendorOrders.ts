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

interface OrderCreationResponse {
  success: boolean;
  order_id?: string;
  error?: string;
  message?: string;
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

        // Prepare order items for server-side validation
        const orderItems = orderData.items.map(item => ({
          id: item.item_id,
          quantity: item.quantity,
          price: item.unit_price
        }));

        // Call server-side validation function (prevents stock manipulation)
        const { data, error } = await supabase.rpc('validate_and_create_cafeteria_order', {
          p_vendor_id: orderData.vendor_id,
          p_order_items: orderItems,
          p_total_amount: orderData.total_amount,
          p_pickup_time: pickupTime.toISOString(),
          p_customer_instructions: orderData.customer_instructions || null
        });

        if (error) throw error;

        // Cast the response to the expected type
        const response = data as unknown as OrderCreationResponse;

        // Check if the server-side validation succeeded
        if (!response.success) {
          throw new Error(response.error || 'Failed to create order');
        }

        // Return the order ID for further processing
        return { id: response.order_id!, status: orderData.status || 'pending' };
      }, { context: { operation: 'creating_vendor_order' } });
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