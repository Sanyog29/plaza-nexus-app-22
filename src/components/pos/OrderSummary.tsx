import React, { useState } from 'react';
import { Edit2, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface OrderSummaryProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onConfirmPayment: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmPayment
}) => {
  const [orderType, setOrderType] = useState('dine-in');
  const [selectedTable, setSelectedTable] = useState('A-12B');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxRate = 0.1; // 10% tax
  const taxes = subtotal * taxRate;
  const discountRate = subtotal >= 50 ? 0.1 : 0; // 10% discount for orders $50+
  const discount = subtotal * discountRate;
  const total = subtotal + taxes - discount;

  const orderNumber = "#B12309";

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center justify-between">
          <span>Order Summary</span>
          <span className="text-sm font-normal text-gray-500">{orderNumber}</span>
        </CardTitle>
      </CardHeader>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <img
                src="/placeholder.svg"
                alt={item.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              
              <div className="flex-1">
                <h4 className="font-medium">{item.name} ({item.quantity})</h4>
                {item.notes && (
                  <p className="text-xs text-gray-500">Notes: {item.notes}</p>
                )}
                <p className="text-sm text-gray-600">Size: Large</p>
                <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
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

        {/* Order Totals */}
        <div className="space-y-2 py-4 border-t">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes</span>
            <span>${taxes.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-${discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total Payment</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Order Controls */}
      <div className="p-4 border-t space-y-4">
        {/* Order Type */}
        <div>
          <label className="text-sm font-medium mb-2 block">Order Type</label>
          <Select value={orderType} onValueChange={setOrderType}>
            <SelectTrigger>
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
          <div>
            <label className="text-sm font-medium mb-2 block">Select Table</label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A-12B">A-12B</SelectItem>
                <SelectItem value="A-11B">A-11B</SelectItem>
                <SelectItem value="B-01A">B-01A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Discount Info */}
        {discount > 0 && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">10% Discount</span>
            </div>
            <p className="text-xs text-green-600 mt-1">Minimum Buy $50.00</p>
          </div>
        )}

        {/* Confirm Payment Button */}
        <Button 
          className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3"
          onClick={onConfirmPayment}
          disabled={cartItems.length === 0}
        >
          Confirm Payment
        </Button>
      </div>
    </div>
  );
};