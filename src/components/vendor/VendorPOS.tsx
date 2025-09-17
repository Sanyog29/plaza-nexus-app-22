import React, { useState, useEffect } from 'react';
import { ModernMenuGrid } from '../pos/ModernMenuGrid';
import { ModernOrderSummary } from '../pos/ModernOrderSummary';
import { ModernPOSHeader } from '../pos/ModernPOSHeader';
import { ModernCategoryTabs } from '../pos/ModernCategoryTabs';
import { UPIPaymentModal } from '../cafeteria/UPIPaymentModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image_url?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  display_order?: number;
}

interface VendorPOSProps {
  vendorId: string;
  onBackToPortal?: () => void;
}

const VendorPOS: React.FC<VendorPOSProps> = ({ vendorId, onBackToPortal }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    orderCount: 0,
    averageOrder: 0
  });
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Clear cart when returning from invoice page
  useEffect(() => {
    const shouldClear = searchParams.get('clearCart');
    if (shouldClear === 'true') {
      setCartItems([]);
      setSearchParams({});
      toast({
        title: "New Transaction",
        description: "Cart cleared. Ready for new order.",
      });
    }
  }, [searchParams, setSearchParams, toast]);

  useEffect(() => {
    fetchTodayStats();
    fetchCategories();
  }, []);

  // Real-time listener for order updates
  useEffect(() => {
    const channel = supabase
      .channel('order-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cafeteria_orders'
        },
        (payload) => {
          console.log('Order update received:', payload);
          fetchTodayStats(); // Refresh stats when orders change
          
          // Show notifications for completed orders
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'completed') {
            toast({
              title: "Order Completed",
              description: `Order #${payload.new.id} has been completed.`,
              variant: "default"
            });
          }
          
          // Show notifications for paid orders
          if (payload.eventType === 'UPDATE' && payload.new?.payment_status === 'paid') {
            toast({
              title: "Payment Received",
              description: `Payment received for Order #${payload.new.id}.`,
              variant: "default"
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const fetchTodayStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('cafeteria_orders')
        .select('total_amount')
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (error) throw error;

      const totalSales = data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
      const orderCount = data?.length || 0;
      const averageOrder = orderCount > 0 ? totalSales / orderCount : 0;

      setDailyStats({
        totalSales,
        orderCount,
        averageOrder
      });
    } catch (error) {
      console.error('Error fetching today stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      // Fetch real categories from database
      const { data: categoriesData, error } = await supabase
        .from('cafeteria_menu_categories')
        .select('id, name, display_order')
        .eq('vendor_id', vendorId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      const transformedCategories: MenuCategory[] = (categoriesData || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        display_order: cat.display_order
      }));
      
      setCategories(transformedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getCategoryItemCount = (categoryId: string): number => {
    // This will be calculated dynamically based on actual menu items
    return 0;
  };

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

  const handleConfirmPayment = async (orderDetails: {
    orderType: string;
    selectedTable?: string;
    customerName: string;
    paymentMethod: string;
  }) => {
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
      const taxes = subtotal * 0.1; // 10% tax
      const discount = 0; // No discount for now
      const serviceCharge = 0; // No service charge for now
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
          service_type: orderDetails.orderType || 'dine-in',
          order_type: 'instant',
          table_number: orderDetails.selectedTable,
          customer_instructions: orderDetails.customerName !== 'Walk-in Customer' ? `Customer: ${orderDetails.customerName}` : null,
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
        orderCount: prev.orderCount + 1,
        averageOrder: (prev.totalSales + total) / (prev.orderCount + 1)
      }));

      toast({
        title: "Order Created",
        description: `Order #${billNumber} created successfully. Proceeding to payment...`,
      });

      // Show payment modal for UPI payment
      setCurrentOrder(order);
      setShowPaymentModal(true);

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

  const handlePaymentSuccess = async () => {
    if (!currentOrder) return;

    try {
      // Mark order as paid and completed using secure RPC
      const { error } = await supabase
        .rpc('mark_order_paid_and_complete', {
          p_order_id: currentOrder.id
        });

      if (error) throw error;

      // Clear cart and close modal
      setCartItems([]);
      setShowPaymentModal(false);
      setCurrentOrder(null);

      toast({
        title: "Payment Successful",
        description: `Order #${currentOrder.bill_number} has been completed successfully!`,
      });

      // Navigate to invoice page
      navigate(`/vendor-portal/invoice/${currentOrder.id}`);

    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Payment successful but failed to update order status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Modern Header */}
      <ModernPOSHeader 
        customerName="Walk-in Customer"
        orderNumber={dailyStats.orderCount.toString().padStart(3, '0')}
        onCloseOrder={() => {
          setCartItems([]);
          toast({
            title: "Order Closed",
            description: "Current order has been cleared."
          });
        }}
        onBackToPortal={onBackToPortal}
      />
      
      {/* Category Navigation */}
      <ModernCategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        getCategoryItemCount={getCategoryItemCount}
      />
      
      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-x-auto">
        <div className="flex items-stretch min-w-[1200px] h-full">
          {/* Menu Area */}
          <ModernMenuGrid
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            cartItems={cartItems}
            vendorId={vendorId}
            selectedCategory={selectedCategory}
          />
          
          {/* Order Summary */}
          <ModernOrderSummary
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onConfirmPayment={handleConfirmPayment}
          />
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && currentOrder && (
        <UPIPaymentModal
          key={currentOrder.id}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderId={currentOrder.bill_number}
          amount={currentOrder.total_amount}
          items={cartItems.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

export default VendorPOS;