import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, CreditCard, Smartphone, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedUPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  onPaymentSuccess: () => void;
}

export const EnhancedUPIPaymentModal: React.FC<EnhancedUPIPaymentModalProps> = ({
  isOpen,
  onClose,
  orderId,
  amount,
  items,
  onPaymentSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'wallet'>('upi');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const generateUPIQRCode = () => {
    const merchantVPA = 'autopilotcafe@paytm';
    const merchantName = 'Autopilot Cafe';
    const transactionRef = `AC${orderId.slice(-8)}`;
    
    const upiLink = `upi://pay?pa=${merchantVPA}&pn=${encodeURIComponent(merchantName)}&tr=${transactionRef}&am=${amount}&cu=INR&mc=5411`;
    
    return upiLink;
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (paymentMethod === 'upi') {
        if (upiId) {
          // Process UPI ID payment
          toast({
            title: "Payment Initiated",
            description: `Payment request sent to ${upiId}`,
          });
        } else {
          // Generate UPI link
          const upiLink = generateUPIQRCode();
          window.open(upiLink, '_blank');
        }
      }
      
      // Simulate successful payment
      setTimeout(() => {
        onPaymentSuccess();
        toast({
          title: "Payment Successful!",
          description: "Your order has been confirmed.",
        });
      }, 3000);
      
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "Please try again or use a different payment method.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const PaymentMethodCard = ({ 
    method, 
    icon: Icon, 
    title, 
    description 
  }: { 
    method: string; 
    icon: any; 
    title: string; 
    description: string; 
  }) => (
    <Card 
      className={`cursor-pointer transition-all ${
        paymentMethod === method 
          ? 'border-plaza-blue bg-plaza-blue/10' 
          : 'border-muted hover:border-plaza-blue/50'
      }`}
      onClick={() => setPaymentMethod(method as any)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-plaza-blue" />
          <div>
            <h3 className="font-medium text-white">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Order Summary */}
          <div className="space-y-2">
            <h3 className="font-medium">Order Summary</h3>
            <div className="bg-muted p-3 rounded-md space-y-1">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>₹{(item.quantity * item.price).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-1 font-medium flex justify-between">
                <span>Total</span>
                <span>₹{amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="font-medium">Select Payment Method</h3>
            
            <PaymentMethodCard
              method="upi"
              icon={Smartphone}
              title="UPI Payment"
              description="Pay using UPI ID or scan QR code"
            />
            
            <PaymentMethodCard
              method="card"
              icon={CreditCard}
              title="Card Payment"
              description="Credit/Debit card payment"
            />
            
            <PaymentMethodCard
              method="wallet"
              icon={Building}
              title="Desk Delivery Balance"
              description="Pay from office account"
            />
          </div>

          {/* UPI Payment Options */}
          {paymentMethod === 'upi' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="upi-id">UPI ID (Optional)</Label>
                  <Input
                    id="upi-id"
                    placeholder="yourname@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      const upiLink = generateUPIQRCode();
                      navigator.clipboard.writeText(upiLink);
                      toast({
                        title: "UPI Link Copied",
                        description: "Open any UPI app to complete payment",
                      });
                    }}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Get QR Code
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Card Payment */}
          {paymentMethod === 'card' && (
            <div className="text-center p-4 bg-muted rounded-md">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Card payment integration coming soon...
              </p>
            </div>
          )}

          {/* Wallet Payment */}
          {paymentMethod === 'wallet' && (
            <div className="text-center p-4 bg-muted rounded-md">
              <Building className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Desk delivery payment will be processed through office accounts
              </p>
            </div>
          )}

          {/* Payment Button */}
          <Button 
            className="w-full" 
            onClick={handlePayment}
            disabled={isProcessing}
            size="lg"
          >
            {isProcessing ? "Processing..." : `Pay ₹${amount.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};