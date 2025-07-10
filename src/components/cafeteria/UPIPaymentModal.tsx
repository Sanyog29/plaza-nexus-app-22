import React, { useState } from 'react';
import { QrCode, CreditCard, CheckCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  onPaymentSuccess: () => void;
}

export const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  items,
  onPaymentSuccess
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'qr'>('qr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  // UPI ID for the cafeteria (this would be configurable)
  const cafeteriaUPI = "cafeteria@sspuaza";
  
  // Generate UPI payment URL
  const generateUPIUrl = () => {
    const params = new URLSearchParams({
      pa: cafeteriaUPI,
      pn: "SS Plaza Cafeteria",
      tr: orderId,
      am: amount.toString(),
      cu: "INR",
      tn: `Order ${orderId} - ${items.length} items`
    });
    return `upi://pay?${params.toString()}`;
  };

  const handleUPIPayment = () => {
    setIsProcessing(true);
    
    // Open UPI app
    const upiUrl = generateUPIUrl();
    window.open(upiUrl, '_blank');
    
    // Simulate payment verification (in real app, you'd verify with backend)
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentComplete(true);
      
      setTimeout(() => {
        toast.success("Payment successful! Your order has been placed.");
        onPaymentSuccess();
        onClose();
      }, 2000);
    }, 3000);
  };

  const handleManualVerification = () => {
    setPaymentComplete(true);
    setTimeout(() => {
      toast.success("Payment verified! Your order has been placed.");
      onPaymentSuccess();
      onClose();
    }, 1000);
  };

  if (paymentComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground">Your order has been placed successfully.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Amount</span>
                <span>₹{amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={paymentMethod === 'qr' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('qr')}
                className="flex-1"
              >
                <QrCode className="w-4 h-4 mr-2" />
                QR Code
              </Button>
              <Button
                variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                onClick={() => setPaymentMethod('upi')}
                className="flex-1"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                UPI Apps
              </Button>
            </div>

            {paymentMethod === 'qr' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    {/* QR Code placeholder - in real app, generate actual QR */}
                    <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                      <QrCode className="w-24 h-24 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Scan with any UPI app</p>
                      <p className="text-xs text-muted-foreground">
                        Order ID: {orderId}
                      </p>
                      <Badge variant="secondary">₹{amount.toFixed(2)}</Badge>
                    </div>
                    
                    {isProcessing ? (
                      <div className="text-sm text-muted-foreground">
                        Waiting for payment confirmation...
                      </div>
                    ) : (
                      <Button 
                        onClick={handleManualVerification}
                        variant="outline"
                        size="sm"
                      >
                        I have completed the payment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {paymentMethod === 'upi' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Pay to UPI ID</p>
                      <Badge variant="outline" className="text-base px-4 py-2">
                        {cafeteriaUPI}
                      </Badge>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Amount: ₹{amount.toFixed(2)}</p>
                        <p>Order ID: {orderId}</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handleUPIPayment}
                      className="w-full"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay with UPI App
                        </>
                      )}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground">
                      You will be redirected to your UPI app
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};