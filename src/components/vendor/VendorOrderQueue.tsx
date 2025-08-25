import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, User, Phone } from 'lucide-react';
import { handleSupabaseError } from '@/utils/errorHandler';

interface VendorOrderQueueProps {
  vendorId: string;
}

const VendorOrderQueue: React.FC<VendorOrderQueueProps> = ({ vendorId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['vendor-orders', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafeteria_orders')
        .select(`
          *,
          order_items (
            *,
            vendor_item:vendor_menu_items(name, price)
          )
        `)
        .eq('vendor_id', vendorId)
        .in('status', ['confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from('cafeteria_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        // Handle duplicate key conflicts gracefully
        if (error.code === '23505' || error.message?.includes('duplicate key')) {
          console.warn('Order status already updated:', error);
          throw new Error('Order was already updated by another user');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders', vendorId] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating order status:', error);
      const errorMessage = handleSupabaseError(error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500';
      case 'preparing': return 'bg-yellow-500';
      case 'ready': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'New Order';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready for Pickup';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'confirmed': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'completed';
      default: return currentStatus;
    }
  };

  const getNextStatusText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'confirmed': return 'Start Preparing';
      case 'preparing': return 'Mark Ready';
      case 'ready': return 'Mark Completed';
      default: return 'Update';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Active Orders</h3>
          <p className="text-muted-foreground text-center">
            All caught up! New orders will appear here when they come in.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Order Queue</h2>
        <Badge variant="secondary">
          {orders.length} active orders
        </Badge>
      </div>

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Order #{order.id.slice(-6)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{order.total_amount}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Customer #{order.user_id.slice(-6)}
                </span>
              </div>

              {/* Pickup Time */}
              {order.pickup_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Pickup: {format(new Date(order.pickup_time), 'HH:mm')}
                  </span>
                  {order.is_scheduled && (
                    <Badge variant="outline" className="text-xs">
                      Scheduled
                    </Badge>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-2">
                {order.order_items?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>
                      {item.quantity}x {item.vendor_item?.name || item.item_id}
                    </span>
                    <span>₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Special Instructions */}
              {order.customer_instructions && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium mb-1">Special Instructions:</p>
                  <p className="text-sm text-muted-foreground">{order.customer_instructions}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => updateOrderStatus.mutate({
                    orderId: order.id,
                    status: getNextStatus(order.status)
                  })}
                  disabled={updateOrderStatus.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {getNextStatusText(order.status)}
                </Button>
                
                {order.status === 'confirmed' && (
                  <Button
                    variant="outline"
                    onClick={() => updateOrderStatus.mutate({
                      orderId: order.id,
                      status: 'cancelled'
                    })}
                    disabled={updateOrderStatus.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default VendorOrderQueue;