import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const OrderHistory: React.FC = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['order-history'],
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
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'confirmed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ready':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-green-600/10 text-green-600 border-green-600/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No orders yet. Start by placing your first order!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-card rounded-lg p-4 card-shadow">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {getStatusIcon(order.status)}
                <Badge 
                  variant="outline" 
                  className={getStatusColor(order.status)}
                >
                  {order.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Order #{order.id.slice(-8)} • {format(new Date(order.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg">₹{order.total_amount}</p>
              {order.pickup_time && (
                <p className="text-xs text-muted-foreground">
                  Pickup: {format(new Date(order.pickup_time), 'HH:mm')}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {order.order_items?.map((item: any, index: number) => (
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
                <span className="font-medium">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderHistory;