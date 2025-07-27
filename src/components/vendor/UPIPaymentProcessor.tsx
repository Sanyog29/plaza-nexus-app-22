import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditCard, 
  Smartphone, 
  Check, 
  Clock, 
  AlertCircle,
  Banknote,
  Scan,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UPIPaymentProcessorProps {
  orderId: string;
  amount: number;
  onPaymentSuccess: () => void;
}

const UPIPaymentProcessor: React.FC<UPIPaymentProcessorProps> = ({
  orderId,
  amount,
  onPaymentSuccess
}) => {
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  const processUPIPayment = async (method: string) => {
    try {
      setPaymentStatus('processing');
      setPaymentMethod(method);

      // Simulate UPI payment processing
      const mockTransactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      // In a real implementation, this would integrate with actual UPI payment gateway
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update order with payment details
      const { error } = await supabase
        .from('cafeteria_orders')
        .update({
          payment_status: 'paid',
          payment_method: method,
          transaction_id: mockTransactionId,
          paid_at: new Date().toISOString(),
          status: 'confirmed'
        })
        .eq('id', orderId);

      if (error) throw error;

      setTransactionId(mockTransactionId);
      setPaymentStatus('success');
      
      toast({
        title: "Payment Successful",
        description: `Payment of ₹${amount} completed via ${method}`,
      });

      onPaymentSuccess();
      
    } catch (error: any) {
      setPaymentStatus('failed');
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const retryPayment = () => {
    setPaymentStatus('pending');
    setPaymentMethod('');
    setTransactionId('');
  };

  if (paymentStatus === 'success') {
    return (
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Payment Successful!</h3>
          <p className="text-muted-foreground mb-4">
            ₹{amount} paid via {paymentMethod}
          </p>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">Transaction ID</p>
            <p className="text-sm font-mono">{transactionId}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Payment Failed</h3>
          <p className="text-muted-foreground mb-4">
            Unable to process payment. Please try again.
          </p>
          <Button onClick={retryPayment} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Payment
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
          <p className="text-muted-foreground mb-4">
            Please complete payment on your {paymentMethod} app
          </p>
          <Badge variant="secondary">₹{amount}</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Choose Payment Method
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold mb-2">₹{amount}</div>
          <p className="text-muted-foreground">Total Amount</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 flex flex-col gap-2"
            onClick={() => processUPIPayment('Google Pay')}
          >
            <Smartphone className="w-6 h-6" />
            <span className="text-sm">Google Pay</span>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex flex-col gap-2"
            onClick={() => processUPIPayment('PhonePe')}
          >
            <Smartphone className="w-6 h-6" />
            <span className="text-sm">PhonePe</span>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex flex-col gap-2"
            onClick={() => processUPIPayment('Paytm')}
          >
            <Smartphone className="w-6 h-6" />
            <span className="text-sm">Paytm</span>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex flex-col gap-2"
            onClick={() => processUPIPayment('UPI ID')}
          >
            <Scan className="w-6 h-6" />
            <span className="text-sm">UPI ID</span>
          </Button>
        </div>

        <div className="border-t pt-4">
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => processUPIPayment('Cash')}
          >
            <Banknote className="w-5 h-5 mr-2" />
            Cash Payment
          </Button>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Secure payment powered by UPI
        </div>
      </CardContent>
    </Card>
  );
};

export default UPIPaymentProcessor;