import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Smartphone, Banknote, Gift, Tag } from 'lucide-react';
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image_url?: string;
}
interface ModernOrderSummaryProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onConfirmPayment: (orderDetails: {
    orderType: string;
    selectedTable?: string;
    customerName: string;
    paymentMethod: string;
  }) => void;
}
export const ModernOrderSummary: React.FC<ModernOrderSummaryProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmPayment
}) => {
  const [orderType, setOrderType] = useState<string>("dine-in");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [promoCode, setPromoCode] = useState<string>("");
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10% tax
  const discount = promoCode ? subtotal * 0.05 : 0; // 5% discount if promo code
  const total = subtotal + tax - discount;
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateQuantity(itemId, newQuantity);
    }
  };
  const handleConfirmPayment = () => {
    if (cartItems.length === 0) return;
    if (orderType === "dine-in" && !selectedTable) return;
    onConfirmPayment({
      orderType,
      selectedTable: orderType === "dine-in" ? selectedTable : undefined,
      customerName: customerName || "Walk-in Customer",
      paymentMethod
    });
  };
  const paymentMethods = [{
    id: "card",
    label: "Credit Card",
    icon: CreditCard
  }, {
    id: "upi",
    label: "UPI Payment",
    icon: Smartphone
  }, {
    id: "cash",
    label: "Cash",
    icon: Banknote
  }];
  return <div className="w-80 shrink-0 bg-card border-l border-border flex flex-col h-full min-h-0

">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Current Order</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Order Type and Table Selection */}
      <div className="p-6 border-b border-border space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orderType">Order Type</Label>
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dine-in">Dine In</SelectItem>
              <SelectItem value="takeaway">Take Away</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {orderType === "dine-in" && <div className="space-y-2">
            <Label htmlFor="table">Table Number</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(table => <SelectItem key={table} value={`table-${table}`}>
                    Table {table}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>}

        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input id="customerName" placeholder="Enter customer name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {cartItems.length === 0 ? <div className="flex flex-col items-center justify-center p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium text-foreground">No Item Selected</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add items from the menu to start building an order
            </p>
          </div> : <div className="p-6 space-y-3">
            {cartItems.map(item => <Card key={item.id} className="p-3">
                <div className="flex items-start gap-3">
                  {item.image_url && <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded object-cover" />}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </h4>
                     <p className="text-xs text-muted-foreground">
                       ₹{item.price.toFixed(0)} each
                     </p>
                    {item.notes && <p className="text-xs text-muted-foreground italic">
                        {item.notes}
                      </p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.id, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onRemoveItem(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>)}
          </div>}
      </div>

      {/* Order Summary and Payment */}
      {cartItems.length > 0 && <div className="border-t border-border">
          {/* Promo Code */}
          <div className="p-6 border-b border-border">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input placeholder="Promo code" value={promoCode} onChange={e => setPromoCode(e.target.value)} className="text-sm" />
              </div>
              <Button variant="outline" size="sm">
                <Tag className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Order Totals */}
          <div className="p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">₹{subtotal.toFixed(0)}</span>
            </div>
            
            {discount > 0 && <div className="flex justify-between text-sm">
                <span className="text-success">Discount (5%)</span>
                <span className="text-success">-₹{discount.toFixed(0)}</span>
              </div>}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{total.toFixed(0)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="p-6 border-t border-border">
            <Label className="text-sm font-medium">Payment Method</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {paymentMethods.map(method => {
            const IconComponent = method.icon;
            return <Button key={method.id} variant={paymentMethod === method.id ? "default" : "outline"} size="sm" onClick={() => setPaymentMethod(method.id)} className="flex flex-col items-center gap-1 h-auto py-3">
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs">{method.label}</span>
                  </Button>;
          })}
            </div>
          </div>

          {/* Place Order Button */}
          <div className="p-6 sticky bottom-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border mobile-safe">
            <Button onClick={handleConfirmPayment} disabled={cartItems.length === 0 || orderType === "dine-in" && !selectedTable} className="w-full btn-primary" size="lg">
              Place Order
              <span className="ml-2">₹{total.toFixed(0)}</span>
            </Button>
          </div>
        </div>}
    </div>;
};