import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, CreditCard, Smartphone, QrCode, ArrowLeft } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
import qrcode from 'qrcode';
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
interface Vendor {
  id: string;
  name: string;
  contact_phone?: string;
  store_config?: {
    upi_id?: string;
    business_name?: string;
    custom_qr_url?: string;
    use_custom_qr?: boolean;
  } | null;
}
interface EnhancedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  onPaymentSuccess: () => void;
  orderType: string;
  tableNumber?: string;
  vendorId: string;
}
export const EnhancedPaymentModal: React.FC<EnhancedPaymentModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  subtotal,
  discount,
  total,
  onPaymentSuccess,
  orderType,
  tableNumber,
  vendorId
}) => {
  const [billNumber] = useState(() => Math.floor(Math.random() * 9999) + 1);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  useEffect(() => {
    if (isOpen && vendorId) {
      fetchVendorData();
    }
  }, [isOpen, vendorId]);
  const fetchVendorData = async () => {
    try {
      const {
        data: vendorData,
        error
      } = await supabase.from('vendors').select('id, name, contact_phone, store_config').eq('id', vendorId).single();
      if (error) throw error;
      setVendor(vendorData as Vendor);
      await generateQRCode(vendorData as Vendor);
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    }
  };
  const generateQRCode = async (vendorData: Vendor) => {
    try {
      const storeConfig = vendorData.store_config;

      // Check if vendor has custom QR code
      if (storeConfig?.use_custom_qr && storeConfig?.custom_qr_url) {
        setQrCodeUrl(storeConfig.custom_qr_url);
        return;
      }

      // Generate auto QR code
      const upiId = storeConfig?.upi_id || vendorData.contact_phone + '@upi';
      const businessName = storeConfig?.business_name || vendorData.name;
      const orderRef = billNumber.toString().padStart(4, '0');
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(businessName)}&am=${total}&tn=${encodeURIComponent(`Order ${orderRef}`)}&cu=INR`;
      const qrUrl = await qrcode.toDataURL(upiUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };
  const handlePayment = async (method: 'upi' | 'card') => {
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onPaymentSuccess();
      onClose();
    }, 2000);
  };
  const formatCurrency = (amount: number) => `₹${amount.toFixed(0)}`;
  if (!isOpen) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-gradient-to-br from-blue-50 to-purple-50 border-0 shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex flex-col h-full">
          {/* Fixed Header with Bill Number */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <button onClick={onClose} className="absolute top-3 right-3 p-2 hover:bg-white/20 rounded-full transition-colors touch-manipulation z-50" style={{
            minWidth: '44px',
            minHeight: '44px'
          }}>
              <X className="w-5 h-5" />
            </button>
            
            <DialogTitle className="relative z-10 text-lg font-semibold mb-2">
              Order Invoice
            </DialogTitle>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" style={{
          WebkitOverflowScrolling: 'touch'
        }}>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold mb-3 text-gray-800">Order Details</h4>
              <div className="space-y-2">
                {cartItems.map(item => <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>)}
              </div>
            </div>

            {/* Order Type & Table */}
            

            {/* Bill Summary */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            {!paymentMethod ? <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Choose Payment Method</h4>
                
                <Button onClick={() => setPaymentMethod('upi')} className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 touch-manipulation" style={{
              minHeight: '56px'
            }}>
                  <Smartphone className="w-5 h-5 mr-2" />
                  Pay with UPI
                </Button>
                
                <Button onClick={() => setPaymentMethod('card')} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 touch-manipulation" style={{
              minHeight: '56px'
            }}>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay with Card
                </Button>
              </div> : <div className="space-y-4">
                {/* Back Button */}
                <Button variant="outline" onClick={() => setPaymentMethod(null)} className="flex items-center space-x-2 text-sm py-3 px-4 touch-manipulation w-full justify-center" style={{
              minHeight: '48px'
            }}>
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Payment Methods</span>
                </Button>

                {/* UPI Payment */}
                {paymentMethod === 'upi' && <div className="bg-white rounded-lg p-6 text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-green-600 mb-4">
                      <QrCode className="w-6 h-6" />
                      <span className="font-semibold">Scan to Pay</span>
                    </div>
                    
                    
                    
                    <div className="text-sm text-gray-600">
                      <p>UPI ID: {vendor?.store_config?.upi_id || vendor?.contact_phone + '@upi'}</p>
                      <p>Amount: {formatCurrency(total)}</p>
                    </div>
                    
                    <Button onClick={() => handlePayment('upi')} disabled={isProcessing} className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-lg shadow-lg touch-manipulation" style={{
                minHeight: '56px'
              }}>
                      {isProcessing ? <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div> : 'Confirm Payment'}
                    </Button>
                  </div>}

                {/* Card Payment */}
                {paymentMethod === 'card' && <div className="bg-white rounded-lg p-6 space-y-4">
                    <div className="text-center text-blue-600 font-semibold mb-4">
                      <CreditCard className="w-8 h-8 mx-auto mb-2" />
                      Card Payment
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                        <input type="text" placeholder="1234 5678 9012 3456" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                          <input type="text" placeholder="MM/YY" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                          <input type="text" placeholder="123" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                      </div>
                    </div>
                    
                    <Button onClick={() => handlePayment('card')} disabled={isProcessing} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-lg shadow-lg mt-4 touch-manipulation" style={{
                minHeight: '56px'
              }}>
                      {isProcessing ? <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div> : `Pay ${formatCurrency(total)}`}
                    </Button>
                  </div>}
              </div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};