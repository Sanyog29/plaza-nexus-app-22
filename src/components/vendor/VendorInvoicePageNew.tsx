import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Moon, Sun, RefreshCw, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [darkMode, setDarkMode] = useState(false);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-GB', { hour12: false }); // HH:MM:SS format
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-gray-800 text-xl">Loading invoice...</div>
      </div>
    );
  }

  if (!order || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-gray-800 text-xl">Invoice not found</div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex flex-col transition-colors duration-500 ${
        darkMode
          ? "bg-gradient-to-b from-black to-blue-900 text-white"
          : "bg-gradient-to-b from-gray-50 to-white text-gray-800"
      }`}
    >
      {/* Navigation Bar */}
      <div
        className={`w-full flex justify-between items-center p-4 mx-6 my-6 rounded-xl ${
          darkMode ? "bg-black" : "bg-gray-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
            {vendor.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold">{vendor.name}</p>
            <p className="text-xs text-gray-500">Food Service</p>
          </div>
          <span className="ml-2 bg-green-500 text-xs px-2 py-1 rounded-full text-white">Active</span>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <a href="#" className="hover:text-blue-500">Dashboard</a>
          <a href="#" className="hover:text-blue-500">Orders</a>
          <a href="#" className="hover:text-blue-500">Menu</a>
          <a href="#" className="hover:text-blue-500">Analytics</a>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="text-gray-400 hover:text-gray-600"
            title="Toggle Light/Dark Mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-gray-600">
            <Bell className="w-5 h-5" />
          </button>
          <div className="bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center text-white">
            G
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="flex-1 flex flex-col items-center px-6">
        <div className="w-full max-w-4xl">
          {/* Invoice Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light italic mb-6">Invoice</h1>
            
            <div className="grid grid-cols-2 gap-8 text-sm mb-8">
              <div className="text-left space-y-1">
                <p><span className="font-medium">Order ID:</span> {order.bill_number || `INV${orderId?.slice(-8)}`}</p>
                <p><span className="font-medium">Date:</span> {formatDate(order.created_at)}</p>
              </div>
              <div className="text-right space-y-1">
                <p><span className="font-medium">Time:</span> {formatTime(order.created_at)}</p>
                <p><span className="font-medium">Table:</span> {order.table_number || 'A-12B'}</p>
                <p><span className="font-medium">Service:</span> {order.service_type || 'dine-in'}</p>
              </div>
            </div>
          </div>

          {/* Invoice Table and QR Code */}
          <div className="flex flex-col lg:flex-row gap-12 mb-8">
            {/* Items Table */}
            <div className="flex-1">
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-3 gap-4 pb-3 border-b-2 border-gray-200 font-semibold">
                  <span>Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right">Amount</span>
                </div>
                
                {/* Table Rows */}
                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 py-2">
                    <span>{item.item_id}</span>
                    <span className="text-center">{item.quantity}</span>
                    <span className="text-right">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                
                {/* Total */}
                <div className="border-t-2 border-gray-200 pt-4 mt-6">
                  <div className="grid grid-cols-3 gap-4 font-bold text-lg">
                    <span>Total</span>
                    <span></span>
                    <span className="text-right">₹{order.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="flex flex-col items-center justify-start lg:w-1/3">
              {qrCodeUrl && (
                <div className="text-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="Payment QR Code" 
                    className="w-48 h-48 rounded-xl mb-3"
                  />
                  <p className="text-xs text-gray-500">
                    UPI ID: {(vendor.store_config as any)?.upi_id || vendor.contact_phone + '@upi'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(vendor.store_config as any)?.business_name || vendor.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Status */}
          {order.payment_status === 'completed' ? (
            <div className="text-center mb-8">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
                ✅ Payment Completed
              </div>
            </div>
          ) : (
            <div className="text-center mb-8">
              <Button
                onClick={handlePayNow}
                disabled={paymentProcessing}
                className="bg-blue-500 hover:bg-blue-600 text-white px-12 py-6 rounded-full text-lg font-medium"
              >
                {paymentProcessing ? 'Processing...' : 'Pay Now'}
              </Button>
            </div>
          )}

          {/* Home Icon */}
          <div className="text-center">
            <button 
              onClick={() => navigate('/vendor-portal?tab=pos&clearCart=true')}
              className="text-gray-400 hover:text-gray-600"
            >
              <Home className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}