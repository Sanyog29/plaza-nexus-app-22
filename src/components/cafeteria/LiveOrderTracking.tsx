import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Package, CheckCircle, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const LiveOrderTracking: React.FC = () => {
  const { toast } = useToast();

  const { data: activeOrders = [], isLoading } = useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('cafeteria_orders')
        .select(`
          *,
          order_items (
            *,
            cafeteria_menu_items (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getOrderSteps = (status: string) => {
    const steps = [
      { key: 'confirmed', label: 'Order Confirmed', icon: CheckCircle },
      { key: 'preparing', label: 'Preparing', icon: Package },
      { key: 'ready', label: 'Ready for Pickup', icon: Bell },
    ];

    const currentIndex = steps.findIndex(step => step.key === status);
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const getEstimatedTime = (orderTime: string, status: string) => {
    const orderDate = new Date(orderTime);
    const now = new Date();
    const minutesElapsed = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60));

    switch (status) {
      case 'confirmed':
        return `Estimated: ${Math.max(0, 15 - minutesElapsed)} min`;
      case 'preparing':
        return `Estimated: ${Math.max(0, 10 - minutesElapsed)} min`;
      case 'ready':
        return 'Ready now!';
      default:
        return '';
    }
  };

  const handleNotifyWhenReady = (orderId: string) => {
    toast({
      title: "Notification Set",
      description: "We'll notify you when your order is ready for pickup!",
    });
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading active orders...</div>;
  }

  if (activeOrders.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Package className="h-5 w-5" />
        Active Orders
      </h3>
      
      {activeOrders.map((order) => {
        const steps = getOrderSteps(order.status);
        const estimatedTime = getEstimatedTime(order.created_at, order.status);

        return (
          <Card key={order.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">Order #{order.id.slice(-8)}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), 'MMM dd, HH:mm')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={order.status === 'ready' ? 'default' : 'secondary'}
                    className={order.status === 'ready' ? 'bg-green-500 hover:bg-green-600' : ''}
                  >
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">₹{order.total_amount}</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-2">
                {order.order_items?.slice(0, 2).map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    {item.cafeteria_menu_items?.image_url && (
                      <img 
                        src={item.cafeteria_menu_items.image_url} 
                        alt={item.cafeteria_menu_items?.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <span className="flex-1">{item.cafeteria_menu_items?.name}</span>
                    <span className="text-muted-foreground">x{item.quantity}</span>
                  </div>
                ))}
                {order.order_items && order.order_items.length > 2 && (
                  <p className="text-sm text-muted-foreground">
                    +{order.order_items.length - 2} more items
                  </p>
                )}
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                        step.completed 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-xs mt-1 text-center ${
                        step.active ? 'text-primary font-medium' : 'text-muted-foreground'
                      }`}>
                        {step.label}
                      </span>
                      {index < steps.length - 1 && (
                        <div className={`w-full h-0.5 mt-2 ${
                          step.completed ? 'bg-primary' : 'bg-muted'
                        }`} style={{ marginLeft: '50%', width: '100%' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Estimated Time and Actions */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm text-muted-foreground">{estimatedTime}</span>
                {order.status !== 'ready' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNotifyWhenReady(order.id)}
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    Notify Me
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LiveOrderTracking;