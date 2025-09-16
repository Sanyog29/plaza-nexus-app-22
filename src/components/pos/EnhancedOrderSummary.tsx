import React, { useState } from 'react';
import { Edit2, Trash2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface EnhancedOrderSummaryProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onConfirmPayment: (paymentData: any) => void;
}

export const EnhancedOrderSummary: React.FC<EnhancedOrderSummaryProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmPayment
}) => {
  const [orderType, setOrderType] = useState('dine-in');
  const [selectedTable, setSelectedTable] = useState('');
  const [customerName, setCustomerName] = useState('Walk-in Customer');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Simplified totals - no tax, service charge, discount as per requirements
  const total = subtotal;

  const orderNumber = "#POS" + Date.now().toString().slice(-6);

  const handleQuantityChange = (itemId: string, delta: number) => {
    const item = cartItems.find(i => i.id === itemId);
    if (item) {
      const newQuantity = Math.max(0, item.quantity + delta);
      onUpdateQuantity(itemId, newQuantity);
    }
  };

  const handleConfirmPayment = () => {
    const paymentData = {
      orderType,
      tableNumber: orderType === 'dine-in' ? selectedTable : null,
      customerName,
      subtotal,
      total,
      taxRate: 0,
      discount: 0,
      serviceCharge: 0,
    };
    onConfirmPayment(paymentData);
  };

  return (
    <Card className="w-[400px] h-full flex flex-col border-l border-border">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Order Summary</span>
          <Badge variant="outline" className="text-xs">{orderNumber}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Cart Items */}
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 py-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items in cart</p>
                <p className="text-sm">Add items from the menu</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <img
                    src="/placeholder.svg"
                    alt={item.name}
                    className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">₹{item.price}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <span className="font-semibold text-sm">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Order Totals */}
        <div className="px-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total Payment</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Order Controls */}
        <div className="px-4 py-4 space-y-4">
          {/* Order Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dine-in">Dine-in</SelectItem>
                <SelectItem value="takeaway">Takeaway</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table Selection */}
          {orderType === 'dine-in' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Table</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Choose table" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A-01">Table A-01</SelectItem>
                  <SelectItem value="A-02">Table A-02</SelectItem>
                  <SelectItem value="B-01">Table B-01</SelectItem>
                  <SelectItem value="B-02">Table B-02</SelectItem>
                  <SelectItem value="C-01">Table C-01</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Customer Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Customer Name</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="h-9"
            />
          </div>

          {/* Confirm Payment Button */}
          <Button 
            className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            onClick={handleConfirmPayment}
            disabled={cartItems.length === 0 || (orderType === 'dine-in' && !selectedTable)}
          >
            Confirm Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};