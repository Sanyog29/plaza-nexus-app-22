import React, { useState, useEffect } from 'react';
import { MenuGrid } from '@/components/pos/MenuGrid';
import { EnhancedOrderSummary } from '@/components/pos/EnhancedOrderSummary';
import { CategoryTabs } from '@/components/pos/CategoryTabs';
import { UnifiedPOSLayout } from '@/components/pos/UnifiedPOSLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useSearchParams } from 'react-router-dom';
// import { useVendorRealtime } from '@/hooks/useVendorRealtime';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface VendorPOSProps {
  vendorId: string;
}

const VendorPOS: React.FC<VendorPOSProps> = ({ vendorId }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    ordersCount: 0,
    avgOrderValue: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Clear cart when returning from invoice page or when specified
  useEffect(() => {
    const shouldClear = searchParams.get('clearCart');
    if (shouldClear === 'true') {
      setCartItems([]);
      // Remove the clearCart parameter from URL
      setSearchParams({});
      toast({
        title: "New Transaction",
        description: "Cart cleared. Ready for new order.",
      });
    }
  }, [searchParams, setSearchParams, toast]);

  // Fetch today's stats on mount
  useEffect(() => {
    fetchTodayStats();
  }, [vendorId]);

  const fetchTodayStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: orders, error } = await supabase
        .from('cafeteria_orders')
        .select('total_amount, status')
        .eq('vendor_id', vendorId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .eq('status', 'completed');

      if (error) throw error;

      const totalSales = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const ordersCount = orders?.length || 0;
      const avgOrderValue = ordersCount > 0 ? totalSales / ordersCount : 0;

      setDailyStats({
        totalSales,
        ordersCount,
        avgOrderValue
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  // Set up real-time updates for vendor orders
  // useVendorRealtime({
  //   vendorId,
  //   onOrderUpdate: fetchTodayStats,
  //   onOrderCompleted: (order) => {
  //     toast({
  //       title: "Order Completed",
  //       description: `Order #${order.bill_number || order.id.slice(0, 8)} has been paid!`,
  //     });
  //   }
  // });

  const handleAddToCart = (newItem: CartItem) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === newItem.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      
      return [...prev, newItem];
    });

    toast({
      title: "Added to Cart",
      description: `${newItem.name} added to your order`,
    });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    toast({
      title: "Item Removed",
      description: "Item removed from your order",
    });
  };

  const handleConfirmPayment = async (paymentData: any) => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before confirming payment",
        variant: "destructive",
      });
      return;
    }

    try {
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const taxes = subtotal * (paymentData.taxRate || 0.1);
      const discount = paymentData.discount || 0;
      const serviceCharge = paymentData.serviceCharge || 0;
      const total = subtotal + taxes + serviceCharge - discount;

      // Generate bill number
      const billNumber = `INV${Date.now().toString().slice(-8)}`;

      // Create order in database with pending payment status
      const { data: order, error: orderError } = await supabase
        .from('cafeteria_orders')
        .insert({
          user_id: user?.id,
          vendor_id: vendorId,
          total_amount: total,
          discount_applied: discount,
          status: 'pending',
          payment_status: 'pending',
          service_type: paymentData.orderType || 'dine-in',
          order_type: 'instant',
          table_number: paymentData.tableNumber,
          customer_instructions: paymentData.customerName !== 'Walk-in Customer' ? `Customer: ${paymentData.customerName}${paymentData.customerPhone ? `, Phone: ${paymentData.customerPhone}` : ''}` : null,
          bill_number: billNumber,
          pickup_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Add order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        item_id: item.name, // Using name as item_id since we don't have a proper item catalog
        quantity: item.quantity,
        unit_price: item.price,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.warn('Order items insertion failed:', itemsError);
        // Continue anyway since main order was created
      }

      // Update daily stats immediately
      setDailyStats(prev => ({
        totalSales: prev.totalSales + total,
        ordersCount: prev.ordersCount + 1,
        avgOrderValue: (prev.totalSales + total) / (prev.ordersCount + 1)
      }));

      toast({
        title: "Order Created",
        description: `Order #${billNumber} created successfully. Redirecting to payment...`,
      });

      return order;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Order Creation Failed",
        description: "There was an error creating your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <UnifiedPOSLayout>
      <div className="flex h-full">
        {/* Menu Grid - Takes up most of the space */}
        <div className="flex-1 border-r">
          <MenuGrid 
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            cartItems={cartItems}
            vendorId={vendorId}
          />
        </div>
        
        {/* Order Summary - Fixed width on the right */}
        <div className="w-80 lg:w-96 flex-shrink-0">
          <EnhancedOrderSummary
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onConfirmPayment={handleConfirmPayment}
          />
        </div>
      </div>
    </UnifiedPOSLayout>
  );
};

export default VendorPOS;