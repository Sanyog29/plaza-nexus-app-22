import React, { useState } from 'react';
import { Edit2, Trash2, Receipt, Printer, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface VendorOrderSummaryProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onConfirmPayment: (paymentData: any) => Promise<any>;
  vendorId: string;
}

export const VendorOrderSummary: React.FC<VendorOrderSummaryProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmPayment,
  vendorId
}) => {
  const [orderType, setOrderType] = useState('dine-in');
  const [selectedTable, setSelectedTable] = useState('A-12B');
  const [taxRate, setTaxRate] = useState(0.1); // Configurable tax rate
  const [customDiscount, setCustomDiscount] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [lastOrder, setLastOrder] = useState<any>(null);
  const { toast } = useToast();

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxes = subtotal * taxRate;
  const autoDiscount = subtotal >= 50 ? subtotal * 0.1 : 0; // Auto discount for orders $50+
  const totalDiscount = autoDiscount + customDiscount;
  const serviceChargeAmount = subtotal * (serviceCharge / 100);
  const total = subtotal + taxes + serviceChargeAmount - totalDiscount;

  const orderNumber = `#POS${Date.now().toString().slice(-6)}`;

  const handleConfirmPayment = async () => {
    try {
      const paymentData = {
        orderType,
        tableNumber: orderType === 'dine-in' ? selectedTable : null,
        taxRate,
        discount: totalDiscount,
        serviceCharge: serviceChargeAmount,
        paymentMethod,
        customerName: customerName || 'Walk-in Customer',
        customerPhone,
      };

      const order = await onConfirmPayment(paymentData);
      if (order) {
        setLastOrder({
          ...order,
          items: [...cartItems],
          paymentData
        });
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error);
    }
  };

  const generateReceipt = () => {
    if (!lastOrder) return;

    const receiptContent = `
RECEIPT - ${orderNumber}
================================
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

Customer: ${customerName || 'Walk-in Customer'}
${customerPhone ? `Phone: ${customerPhone}` : ''}
Order Type: ${orderType}
${orderType === 'dine-in' ? `Table: ${selectedTable}` : ''}

ITEMS:
${cartItems.map(item => 
  `${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

--------------------------------
Subtotal: ₹${subtotal.toFixed(2)}
Tax (${(taxRate * 100).toFixed(1)}%): ₹${taxes.toFixed(2)}
${serviceChargeAmount > 0 ? `Service Charge: ₹${serviceChargeAmount.toFixed(2)}` : ''}
${totalDiscount > 0 ? `Discount: -₹${totalDiscount.toFixed(2)}` : ''}
--------------------------------
TOTAL: ₹${total.toFixed(2)}

Payment Method: ${paymentMethod.toUpperCase()}
================================
Thank you for your business!
    `.trim();

    // Create and download receipt
    const element = document.createElement('a');
    const file = new Blob([receiptContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `receipt_${orderNumber}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast({
      title: "Receipt Generated",
      description: "Receipt has been downloaded",
    });
  };

  return (
    <div className="w-96 bg-background border rounded-lg flex flex-col h-fit">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <span>Order Summary</span>
          <Badge variant="outline">{orderNumber}</Badge>
        </CardTitle>
      </CardHeader>

      <div className="flex-1 overflow-y-auto p-4 max-h-96">
        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
              <img
                src="/placeholder.svg"
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              
              <div className="flex-1">
                <h4 className="font-medium">{item.name} ({item.quantity})</h4>
                {item.notes && (
                  <p className="text-xs text-muted-foreground">Notes: {item.notes}</p>
                )}
                <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
              
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Billing Section */}
      <div className="p-4 border-t space-y-4">
        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="customerName" className="text-xs">Customer Name</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Walk-in Customer"
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="customerPhone" className="text-xs">Phone (Optional)</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone number"
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Order Type */}
        <div>
          <Label className="text-xs font-medium mb-2 block">Order Type</Label>
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dine-in">Dine-in</SelectItem>
              <SelectItem value="takeaway">Takeaway</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table Selection */}
        {orderType === 'dine-in' && (
          <div>
            <Label className="text-xs font-medium mb-2 block">Select Table</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A-12B">A-12B</SelectItem>
                <SelectItem value="A-11B">A-11B</SelectItem>
                <SelectItem value="B-01A">B-01A</SelectItem>
                <SelectItem value="C-05C">C-05C</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Payment Method */}
        <div>
          <Label className="text-xs font-medium mb-2 block">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="wallet">Digital Wallet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Billing Configuration */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">Tax %</Label>
            <Input
              type="number"
              value={taxRate * 100}
              onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
              className="h-8 text-xs"
              step="0.1"
            />
          </div>
          <div>
            <Label className="text-xs">Service %</Label>
            <Input
              type="number"
              value={serviceCharge}
              onChange={(e) => setServiceCharge(Number(e.target.value))}
              className="h-8 text-xs"
              step="0.1"
            />
          </div>
          <div>
            <Label className="text-xs">Discount ₹</Label>
            <Input
              type="number"
              value={customDiscount}
              onChange={(e) => setCustomDiscount(Number(e.target.value))}
              className="h-8 text-xs"
              step="0.1"
            />
          </div>
        </div>

        <Separator />

        {/* Order Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
            <span>₹{taxes.toFixed(2)}</span>
          </div>
          {serviceChargeAmount > 0 && (
            <div className="flex justify-between">
              <span>Service Charge</span>
              <span>₹{serviceChargeAmount.toFixed(2)}</span>
            </div>
          )}
          {totalDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Total Discount</span>
              <span>-₹{totalDiscount.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-base">
            <span>Total Payment</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Auto Discount Info */}
        {autoDiscount > 0 && (
          <div className="bg-green-50 p-2 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-800">10% Auto Discount Applied</span>
            </div>
            <p className="text-xs text-green-600 mt-1">Minimum order ₹50.00</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            className="w-full"
            onClick={handleConfirmPayment}
            disabled={cartItems.length === 0}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Confirm Payment - ₹{total.toFixed(2)}
          </Button>

          {lastOrder && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={generateReceipt}
                className="flex-1"
              >
                <Receipt className="w-4 h-4 mr-2" />
                Receipt
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Printer className="w-4 h-4 mr-2" />
                    Print
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Print Receipt</DialogTitle>
                  </DialogHeader>
                  <div className="p-4 bg-muted rounded-lg font-mono text-xs whitespace-pre-line">
                    {`RECEIPT - ${orderNumber}\n================================\nDate: ${new Date().toLocaleDateString()}\nTime: ${new Date().toLocaleTimeString()}\n\nCustomer: ${customerName || 'Walk-in Customer'}\n${customerPhone ? `Phone: ${customerPhone}` : ''}\nOrder Type: ${orderType}\n${orderType === 'dine-in' ? `Table: ${selectedTable}` : ''}\n\nITEMS:\n${cartItems.map(item => `${item.name} x${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}`).join('\n')}\n\n--------------------------------\nSubtotal: ₹${subtotal.toFixed(2)}\nTax: ₹${taxes.toFixed(2)}\n${serviceChargeAmount > 0 ? `Service: ₹${serviceChargeAmount.toFixed(2)}` : ''}${totalDiscount > 0 ? `\nDiscount: -₹${totalDiscount.toFixed(2)}` : ''}\n--------------------------------\nTOTAL: ₹${total.toFixed(2)}\n\nPayment: ${paymentMethod.toUpperCase()}\n================================\nThank you!`}
                  </div>
                  <Button onClick={() => window.print()} className="w-full">
                    Print Now
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};