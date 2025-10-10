import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  PlayCircle,
  MoreHorizontal,
  Edit3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import OrderTimeline from './OrderTimeline';

interface OrderItem {
  id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  notes?: string;
  special_instructions?: string;
}

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  pickup_time?: string;
  special_instructions?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  order_items: OrderItem[];
  estimated_prep_time?: number;
}

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onOrderUpdate: () => void;
  timeline?: any[];
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onStatusUpdate, 
  onOrderUpdate,
  timeline = []
}) => {
  const [showTimeline, setShowTimeline] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'orange';
      case 'confirmed': return 'blue';
      case 'preparing': return 'purple';
      case 'ready': return 'green';
      case 'completed': return 'emerald';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready',
      'ready': 'completed'
    };
    return statusFlow[currentStatus.toLowerCase() as keyof typeof statusFlow];
  };

  const updateOrderStatus = async (newStatus: string, notes?: string) => {
    setIsUpdating(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-order-status', {
        body: {
          order_id: order.id,
          new_status: newStatus,
          notes: notes,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to update order status');
      }

      // Add timeline entry
      const { error: timelineError } = await supabase
        .from('order_timeline')
        .insert([{
          order_id: order.id,
          status: newStatus,
          notes: notes,
          timestamp: new Date().toISOString()
        }]);

      if (timelineError) {
        console.error('Timeline entry error:', timelineError);
      }

      onStatusUpdate(order.id, newStatus);
      toast({ 
        title: `Order ${newStatus}!`,
        description: data?.message || `Order status updated successfully`
      });
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getTimeElapsed = () => {
    const now = new Date();
    const orderTime = new Date(order.created_at);
    const diff = Math.floor((now.getTime() - orderTime.getTime()) / 1000 / 60);
    return diff;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const totalItems = order.order_items.reduce((sum, item) => sum + item.quantity, 0);
  const timeElapsed = getTimeElapsed();
  const isUrgent = timeElapsed > 30 && order.status !== 'completed';

  return (
    <>
      <Card className={`transition-all duration-200 hover:shadow-md ${
        isUrgent ? 'border-red-200 bg-red-50/50' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg">#{order.id.slice(-6)}</CardTitle>
              {isUrgent && (
                <Badge variant="destructive" className="text-xs">
                  Urgent
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor(order.status) as any}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="bg-background border border-border shadow-lg z-50"
                >
                  <DropdownMenuItem onClick={() => setShowTimeline(true)}>
                    <Clock className="h-4 w-4 mr-2" />
                    View Timeline
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message Customer
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {formatTime(order.created_at)} ({timeElapsed}m ago)
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {order.customer_name || 'Customer'}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Order Items */}
          <div className="space-y-2">
            {order.order_items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-sm font-medium">{item.quantity}x</span>
                  <span className="text-sm ml-2">{item.item_id}</span>
                  {item.special_instructions && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Note: {item.special_instructions}
                    </p>
                  )}
                </div>
                <span className="text-sm font-medium">
                  ${(item.quantity * item.unit_price).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex justify-between items-center font-medium">
            <span>Total ({totalItems} items)</span>
            <span>${order.total_amount.toFixed(2)}</span>
          </div>

          {order.special_instructions && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm">
                <strong>Special Instructions:</strong> {order.special_instructions}
              </p>
            </div>
          )}

          {/* Customer Info */}
          {(order.customer_phone || order.delivery_address) && (
            <div className="space-y-2 text-sm">
              {order.customer_phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  {order.customer_phone}
                </div>
              )}
              {order.delivery_address && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  {order.delivery_address}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            {order.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus('confirmed')}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateOrderStatus('cancelled')}
                  disabled={isUpdating}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </>
            )}

            {order.status === 'confirmed' && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus('preparing')}
                disabled={isUpdating}
                className="flex-1"
              >
                <PlayCircle className="h-4 w-4 mr-1" />
                Start Preparing
              </Button>
            )}

            {order.status === 'preparing' && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus('ready')}
                disabled={isUpdating}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Ready
              </Button>
            )}

            {order.status === 'ready' && (
              <Button
                size="sm"
                onClick={() => updateOrderStatus('completed')}
                disabled={isUpdating}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete Order
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Dialog */}
      <Dialog open={showTimeline} onOpenChange={setShowTimeline}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order #{order.id.slice(-6)} Timeline</DialogTitle>
          </DialogHeader>
          <OrderTimeline timeline={timeline} currentStatus={order.status} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderCard;