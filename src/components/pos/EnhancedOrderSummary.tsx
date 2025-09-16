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
  image_url?: string;
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
    <Card className="h-full flex flex-col m-lg bg-card">
      <CardHeader className="border-b border-border p-xl">
        <CardTitle className="flex items-center justify-between">
          <span className="text-2xl">Order Summary</span>
          <Badge variant="outline" className="text-sm">{orderNumber}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Cart Items */}
        <ScrollArea className="flex-1 p-lg">
          <div className="spacing-md">
            {cartItems.length === 0 ? (
              <div className="text-center p-2xl text-muted-foreground">
                <p className="text-xl">No items in cart</p>
                <p className="text-base">Add items from the menu</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-lg bg-muted/30 rounded-lg">
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/placeholder.svg"; }}
                    alt={`${item.name} photo`}
                    className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-base leading-tight">{item.name}</h4>
                        <p className="text-base text-muted-foreground">₹{item.price}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="text-base font-medium w-10 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="font-semibold text-base">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <Separator />

        {/* Order Totals */}
        <div className="p-lg">
          <div className="spacing-sm">
            <div className="flex justify-between text-base">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Payment</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Order Controls */}
        <div className="p-lg spacing-lg">
          {/* Order Type */}
          <div className="spacing-sm">
            <Label className="text-base font-medium">Order Type</Label>
            <Select value={orderType} onValueChange={setOrderType}>
              <SelectTrigger className="h-12">
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
            <div className="spacing-sm">
              <Label className="text-base font-medium">Select Table</Label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="h-12">
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
          <div className="spacing-sm">
            <Label className="text-base font-medium">Customer Name</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="h-12 text-base"
            />
          </div>

          {/* Confirm Payment Button */}
          <Button 
            className="w-full h-16 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg"
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