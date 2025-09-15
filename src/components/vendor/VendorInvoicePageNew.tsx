import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
    custom_qr_url?: string;
    use_custom_qr?: boolean;
  } | null;
}

export default function VendorInvoicePageNew() {
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
        setVendor(vendorData as any);

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
      const storeConfig = vendorData.store_config as any;
      
      // Check if vendor has custom QR code
      if (storeConfig?.use_custom_qr && storeConfig?.custom_qr_url) {
        setQrCodeUrl(storeConfig.custom_qr_url);
        return;
      }

      // Generate auto QR code
      const upiId = storeConfig?.upi_id || vendorData.contact_phone + '@upi';
      const businessName = storeConfig?.business_name || vendorData.name;
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
    
    window.open(upiUrl, '_blank');
    
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!order || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
        <div className="text-center text-white">
          <p className="mb-4">Order not found</p>
          <Button onClick={handleHomeClick} variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go to POS
          </Button>
        </div>
      </div>
    );
  }

  const billNumbers = order.bill_number ? order.bill_number.split('') : [order.id.slice(0, 1), order.id.slice(1, 2)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-6 text-white">
        <div className="flex items-center gap-3">
          {vendor.logo_url ? (
            <img
              src={vendor.logo_url}
              alt={vendor.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
              {vendor.name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-bold">{vendor.name}</p>
            <p className="text-xs text-white/80">Fast Food</p>
          </div>
          <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">Active</span>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        {/* Bill Number */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-white text-lg">Bill No</span>
          {billNumbers.map((digit, index) => (
            <div key={index} className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">{digit}</span>
            </div>
          ))}
        </div>

        {/* Invoice Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8">
          <div className="flex justify-between items-start">
            {/* Left Side - Invoice */}
            <div className="flex-1">
              <h1 className="text-4xl font-light text-white mb-8 italic">Invoice</h1>
              
              {/* Items */}
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div key={item.id} className="flex justify-between text-white">
                    <span className="text-lg">{item.item_id}</span>
                    <span className="text-lg">{(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Amount & QR */}
            <div className="flex flex-col items-end min-w-[300px]">
              <div className="text-right mb-6">
                <div className="text-white text-lg mb-2">Amount</div>
                <div className="text-white text-3xl font-bold border-b-2 border-white/30 pb-2 mb-4">
                  {order.total_amount.toFixed(2)}
                </div>
              </div>

              {/* QR Code */}
              {qrCodeUrl && (
                <div className="bg-white p-4 rounded-2xl shadow-lg">
                  <img
                    src={qrCodeUrl}
                    alt="Payment QR Code"
                    className="w-32 h-32 mx-auto"
                  />
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-600">UPI NAME: {(vendor.store_config as any)?.business_name || vendor.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Actions */}
        {order.payment_status === 'completed' ? (
          <div className="text-center">
            <div className="bg-green-500 text-white px-6 py-3 rounded-full mb-6 inline-block">
              ✓ Payment Completed Successfully
            </div>
            <Button onClick={handleHomeClick} className="bg-white text-purple-700 hover:bg-gray-100">
              <Home className="h-5 w-5 mr-2" />
              Return to POS
            </Button>
          </div>
        ) : (
          <div className="flex items-end justify-between">
            {/* Pay Now Button */}
            <Button 
              className="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white px-16 py-6 rounded-full text-xl font-medium shadow-lg"
              onClick={handlePayNow}
              disabled={paymentProcessing}
            >
              {paymentProcessing ? "Processing..." : "Pay Now"}
            </Button>

            {/* Home Icon */}
            <Button 
              variant="ghost" 
              size="lg"
              onClick={handleHomeClick}
              className="text-white hover:bg-white/10"
            >
              <Home className="w-8 h-8" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}