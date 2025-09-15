import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import qrcode from "qrcode";

interface OrderItem {
  id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

interface Order {
  id: string;
  total_amount: number;
  bill_number: string;
  vendor_id: string;
  status: string;
  payment_status: string;
  service_type: string;
  table_number?: string;
  customer_instructions?: string;
  created_at: string;
}

interface Vendor {
  id: string;
  name: string;
  logo_url?: string;
  contact_phone?: string;
  bank_account_number?: string;
  upi_id?: string;
  store_config?: {
    upi_id?: string;
    business_name?: string;
  } | null;
}

export default function VendorInvoicePage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('cafeteria_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData || []);

      // Fetch vendor details
      if (orderData.vendor_id) {
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', orderData.vendor_id)
          .single();

        if (vendorError) throw vendorError;
        setVendor(vendorData as any); // Type assertion to handle Json type

        // Generate QR code for payment
        await generateQRCode(orderData, vendorData as any);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (orderData: Order, vendorData: any) => {
    try {
      const upiId = (vendorData.store_config as any)?.upi_id || vendorData.contact_phone + '@upi';
      const businessName = (vendorData.store_config as any)?.business_name || vendorData.name;
      const amount = orderData.total_amount;
      const orderRef = orderData.bill_number || orderData.id.slice(0, 8);
      
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${amount}&tn=${encodeURIComponent(`Order ${orderRef}`)}&cu=INR`;
      
      const qrUrl = await qrcode.toDataURL(upiUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handlePayNow = () => {
    if (!vendor || !order) return;

    const upiId = (vendor.store_config as any)?.upi_id || vendor.contact_phone + '@upi';
    const businessName = (vendor.store_config as any)?.business_name || vendor.name;
    const amount = order.total_amount;
    const orderRef = order.bill_number || order.id.slice(0, 8);
    
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${amount}&tn=${encodeURIComponent(`Order ${orderRef}`)}&cu=INR`;
    
    // Try to open UPI app
    window.open(upiUrl, '_blank');
    
    // Show payment confirmation dialog after a short delay
    setTimeout(() => {
      const confirmed = window.confirm("Have you completed the payment? Click OK to confirm or Cancel to try again.");
      if (confirmed) {
        handlePaymentSuccess();
      }
    }, 2000);
  };

  const handlePaymentSuccess = async () => {
    if (!order) return;
    
    setPaymentProcessing(true);
    
    try {
      // Update order status and payment status
      const { error } = await supabase
        .from('cafeteria_orders')
        .update({
          status: 'completed',
          payment_status: 'completed',
          paid_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Payment Successful!",
        description: `Order ${order.bill_number || order.id.slice(0, 8)} has been paid successfully.`,
      });

      // Auto-redirect to POS after 2 seconds
      setTimeout(() => {
        navigate('/vendor-portal?tab=pos&clearCart=true');
      }, 2000);

    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: "Error",
        description: "Failed to update payment status. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleHomeClick = () => {
    navigate('/vendor-portal?tab=pos&clearCart=true');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!order || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Order not found</p>
          <Button onClick={handleHomeClick}>
            <Home className="h-4 w-4 mr-2" />
            Go to POS
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 bg-gradient-to-b from-background to-secondary/20">
      {/* Navbar */}
      <div className="w-full flex justify-between items-center p-4 rounded-xl mb-10 bg-card shadow-sm">
        <div className="flex items-center gap-3">
          {vendor.logo_url ? (
            <img
              src={vendor.logo_url}
              alt={vendor.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {vendor.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-bold text-foreground">{vendor.name}</p>
            <p className="text-xs text-muted-foreground">Food Vendor</p>
          </div>
          <span className="ml-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">Active</span>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Invoice */}
      <div className="w-full flex flex-col items-center">
        <Card className="bg-card border shadow-lg w-full max-w-4xl">
          <CardContent className="flex flex-col sm:flex-row justify-between items-start w-full gap-10 p-8">
            <div className="flex flex-col w-full">
              <h1 className="text-4xl font-bold mb-8 text-foreground">Invoice</h1>
              
              {/* Order Details */}
              <div className="mb-6 text-sm text-muted-foreground">
                <p>Order ID: {order.bill_number || order.id.slice(0, 8)}</p>
                <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                <p>Time: {new Date(order.created_at).toLocaleTimeString()}</p>
                {order.table_number && <p>Table: {order.table_number}</p>}
                <p>Service: {order.service_type}</p>
              </div>

              {/* Items */}
              <div className="flex flex-col text-left w-full">
                <div className="grid grid-cols-3 w-full mb-4 pb-2 border-b">
                  <span className="font-semibold">Item</span>
                  <span className="font-semibold text-center">Qty</span>
                  <span className="font-semibold text-right">Amount</span>
                </div>

                {orderItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-3 w-full mb-3">
                    <span className="text-foreground">{item.item_id}</span>
                    <span className="text-center">{item.quantity}</span>
                    <span className="text-right">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                <hr className="border-border my-4" />
                <div className="grid grid-cols-3 w-full font-bold text-lg">
                  <span>Total</span>
                  <span></span>
                  <span className="text-right">₹{order.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {order.customer_instructions && (
                <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Special Instructions:</p>
                  <p className="text-foreground">{order.customer_instructions}</p>
                </div>
              )}
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center w-full sm:w-1/3">
              {qrCodeUrl && (
                <div className="text-center">
                  <img
                    src={qrCodeUrl}
                    alt="Payment QR Code"
                    className="rounded-xl shadow-md mb-4"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    UPI ID: {(vendor.store_config as any)?.upi_id || vendor.contact_phone + '@upi'}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    {(vendor.store_config as any)?.business_name || vendor.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        {order.payment_status === 'completed' ? (
          <div className="flex flex-col items-center w-full mt-10">
            <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 px-6 py-3 rounded-full mb-6">
              ✓ Payment Completed Successfully
            </div>
          <Button onClick={handleHomeClick} size="lg">
              <Home className="h-5 w-5 mr-2" />
              Return to POS
            </Button>
          </div>
        ) : (
          <>
            {/* Pay Now Button */}
            <div className="flex justify-center w-full mt-10">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-full text-lg"
                onClick={handlePayNow}
                disabled={paymentProcessing}
              >
                {paymentProcessing ? "Processing..." : "Pay Now"}
              </Button>
            </div>

            {/* Home Icon */}
            <div className="mt-6 flex justify-center w-full">
              <Button variant="ghost" onClick={handleHomeClick}>
                <Home className="w-6 h-6" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}