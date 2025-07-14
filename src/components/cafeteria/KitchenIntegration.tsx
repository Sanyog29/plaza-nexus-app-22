import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  AlertTriangle, 
  Play, 
  Pause,
  Users,
  Timer,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

interface KitchenOrder {
  id: string;
  user_id: string;
  vendor_id: string;
  total_amount: number;
  status: string;
  pickup_time: string;
  preparation_time_minutes: number;
  customer_instructions: string;
  created_at: string;
  order_items?: Array<{
    id: string;
    quantity: number;
    special_instructions?: string;
    vendor_item_id: string;
    vendor_menu_items?: {
      name: string;
      preparation_time_minutes?: number;
    };
  }>;
  customer_name?: string;
}

export const KitchenIntegration: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [preparationTimers, setPreparationTimers] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders for kitchen view
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafeteria_orders')
        .select(`
          *,
          order_items (
            *,
            vendor_menu_items (
              name,
              preparation_time_minutes
            )
          )
        `)
        .in('status', ['confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []);
    },
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Real-time subscription for order updates
  useEffect(() => {
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cafeteria_orders',
          filter: 'status=in.(confirmed,preparing,ready)',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Timer management
  useEffect(() => {
    const interval = setInterval(() => {
      setPreparationTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(orderId => {
          if (updated[orderId] > 0) {
            updated[orderId] -= 1;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('cafeteria_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Order status changed to ${newStatus}`,
      });

      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const startPreparation = (orderId: string, estimatedTime: number) => {
    setPreparationTimers(prev => ({ ...prev, [orderId]: estimatedTime * 60 }));
    updateOrderStatus(orderId, 'preparing');
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (seconds: number, totalTime: number) => {
    const remaining = seconds / totalTime;
    if (remaining > 0.5) return 'text-green-500';
    if (remaining > 0.25) return 'text-yellow-500';
    return 'text-red-500';
  };

  const OrderCard: React.FC<{ order: KitchenOrder }> = ({ order }) => {
    const timer = preparationTimers[order.id];
    const totalEstimatedTime = order.preparation_time_minutes * 60;
    const elapsedTime = new Date().getTime() - new Date(order.created_at).getTime();

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                Order #{order.id.slice(-8)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Customer #{order.user_id.slice(-8)}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={
                order.status === 'confirmed' ? 'secondary' :
                order.status === 'preparing' ? 'default' : 'outline'
              }>
                {order.status.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Ordered: {format(new Date(order.created_at), 'HH:mm')}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Order Items */}
          <div className="space-y-2">
            {(order.order_items || []).map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="flex-1">
                  {item.quantity}x {item.vendor_menu_items?.name || 'Unknown Item'}
                </span>
                {item.special_instructions && (
                  <span className="text-xs text-muted-foreground">
                    Note: {item.special_instructions}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Customer Instructions */}
          {order.customer_instructions && (
            <div className="p-2 bg-muted rounded text-sm">
              <strong>Special Instructions:</strong> {order.customer_instructions}
            </div>
          )}

          {/* Timer Display */}
          {timer !== undefined && (
            <div className="flex items-center justify-center p-3 bg-muted rounded">
              <Timer className="h-4 w-4 mr-2" />
              <span className={`font-mono text-lg ${getTimerColor(timer, totalEstimatedTime)}`}>
                {formatTimer(timer)}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {order.status === 'confirmed' && (
              <Button
                onClick={() => startPreparation(order.id, order.preparation_time_minutes)}
                className="flex-1"
                size="sm"
              >
                <Play className="h-4 w-4 mr-1" />
                Start Preparing
              </Button>
            )}
            
            {order.status === 'preparing' && (
              <Button
                onClick={() => updateOrderStatus(order.id, 'ready')}
                className="flex-1"
                variant="outline"
                size="sm"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Ready
              </Button>
            )}
            
            {order.status === 'ready' && (
              <Button
                onClick={() => updateOrderStatus(order.id, 'completed')}
                className="flex-1"
                variant="secondary"
                size="sm"
              >
                <Users className="h-4 w-4 mr-1" />
                Mark Picked Up
              </Button>
            )}
          </div>

          {/* Pickup Time Warning */}
          {order.pickup_time && (
            <div className="text-xs text-muted-foreground text-center">
              Expected pickup: {format(new Date(order.pickup_time), 'HH:mm')}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Kitchen Analytics
  const pendingOrders = getOrdersByStatus('confirmed').length;
  const preparingOrders = getOrdersByStatus('preparing').length;
  const readyOrders = getOrdersByStatus('ready').length;
  const avgPrepTime = orders.length > 0 
    ? Math.round(orders.reduce((sum, order) => sum + order.preparation_time_minutes, 0) / orders.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Kitchen Dashboard Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-primary" />
            Kitchen Management Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">{pendingOrders}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{preparingOrders}</div>
              <div className="text-sm text-muted-foreground">Preparing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{readyOrders}</div>
              <div className="text-sm text-muted-foreground">Ready</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">{avgPrepTime}m</div>
              <div className="text-sm text-muted-foreground">Avg Prep Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingOrders})
          </TabsTrigger>
          <TabsTrigger value="preparing" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Preparing ({preparingOrders})
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Ready ({readyOrders})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {getOrdersByStatus('confirmed').length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending orders</p>
            </div>
          ) : (
            getOrdersByStatus('confirmed').map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </TabsContent>

        <TabsContent value="preparing" className="space-y-4">
          {getOrdersByStatus('preparing').length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders in preparation</p>
            </div>
          ) : (
            getOrdersByStatus('preparing').map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </TabsContent>

        <TabsContent value="ready" className="space-y-4">
          {getOrdersByStatus('ready').length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders ready for pickup</p>
            </div>
          ) : (
            getOrdersByStatus('ready').map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};