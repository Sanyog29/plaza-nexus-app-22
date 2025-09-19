import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  RefreshCw, 
  Search,
  Home,
  BarChart3,
  Settings,
  LogOut,
  Clock,
  Users
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  description?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

const mockMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Butter Chicken',
    price: 12.64,
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300&h=200&fit=crop',
    category: 'main-course',
    available: true,
    description: 'Creamy tomato-based curry with tender chicken'
  },
  {
    id: '2',
    name: 'French Fries',
    price: 7.50,
    image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300&h=200&fit=crop',
    category: 'appetizer',
    available: true,
    description: 'Crispy golden fries with seasoning'
  },
  {
    id: '3',
    name: 'Roast Beef',
    price: 29.00,
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&h=200&fit=crop',
    category: 'main-course',
    available: true,
    description: 'Slow-roasted beef with herbs'
  },
  {
    id: '4',
    name: 'Sauerkraut',
    price: 11.55,
    image: 'https://images.unsplash.com/photo-1505253213348-cd54c92b37e3?w=300&h=200&fit=crop',
    category: 'appetizer',
    available: true,
    description: 'Traditional fermented cabbage'
  },
  {
    id: '5',
    name: 'Beef Kebab',
    price: 14.95,
    image: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=300&h=200&fit=crop',
    category: 'main-course',
    available: false,
    description: 'Grilled beef skewers with spices'
  },
  {
    id: '6',
    name: 'Fish and Chips',
    price: 23.05,
    image: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?w=300&h=200&fit=crop',
    category: 'main-course',
    available: true,
    description: 'Crispy battered fish with chips'
  },
  {
    id: '7',
    name: 'Chocolate Cake',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&h=200&fit=crop',
    category: 'dessert',
    available: true,
    description: 'Rich chocolate layer cake'
  },
  {
    id: '8',
    name: 'Mango Smoothie',
    price: 5.50,
    image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300&h=200&fit=crop',
    category: 'beverages',
    available: true,
    description: 'Fresh mango blended smoothie'
  }
];

const categories = [
  { id: 'all', name: 'All', count: mockMenuItems.length },
  { id: 'main-course', name: 'Main Course', count: mockMenuItems.filter(item => item.category === 'main-course').length },
  { id: 'appetizer', name: 'Appetizer', count: mockMenuItems.filter(item => item.category === 'appetizer').length },
  { id: 'dessert', name: 'Dessert', count: mockMenuItems.filter(item => item.category === 'dessert').length },
  { id: 'beverages', name: 'Beverages', count: mockMenuItems.filter(item => item.category === 'beverages').length },
];

const sidebarItems = [
  { icon: Home, label: 'Dashboard', active: false },
  { icon: ShoppingCart, label: 'Menu Order', active: true },
  { icon: BarChart3, label: 'Analytics', active: false },
  { icon: Users, label: 'Manage Table', active: false },
  { icon: Settings, label: 'Settings', active: false },
];

export default function FoodPOSPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = mockMenuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (menuItem: MenuItem) => {
    if (!menuItem.available) return;
    
    setCart(prev => {
      const existingItem = prev.find(item => item.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...menuItem, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity === 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev =>
        prev.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = subtotal > 50 ? subtotal * 0.05 : 0;
  const total = subtotal - discount;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-16 lg:w-64 bg-card border-r flex flex-col">
        {/* Logo/Brand */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="font-semibold text-lg">Pospay</h1>
              <p className="text-xs text-muted-foreground">Cashier Daily Assistant</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-1",
                item.active 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-accent text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t">
          <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent text-foreground">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold">Hadid's Food</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                    Open
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Wednesday, 27 Mar 2024 at 9:48 A.M.</p>
              </div>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search Menu"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-sm w-64"
                />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors",
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                <span>{category.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </button>
            ))}
          </div>
        </header>

        {/* Menu Grid */}
        <div className="flex-1 flex min-w-0 overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-32 object-cover"
                    />
                    <Badge 
                      className={cn(
                        "absolute top-2 right-2 text-xs",
                        item.available 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {item.available ? 'Available' : 'Not Available'}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg text-primary">${item.price.toFixed(2)}</span>
                      <Button
                        size="sm"
                        onClick={() => addToCart(item)}
                        disabled={!item.available}
                        className={cn(
                          "h-8 px-3 text-xs",
                          !item.available && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-80 bg-card border-l flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-lg">Order Summary</h2>
                <Badge variant="outline">#B12309</Badge>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              {cart.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No items in cart</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">Notes: None • Size: Large</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm w-8 text-center">({item.quantity})</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 w-6 p-0"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                              onClick={() => updateQuantity(item.id, 0)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Order Totals */}
            {cart.length > 0 && (
              <div className="p-4 border-t space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Payment</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Order Type</span>
                    <select className="text-right bg-transparent border-none text-sm">
                      <option>Dine-in</option>
                      <option>Takeaway</option>
                      <option>Delivery</option>
                    </select>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Select Table</span>
                    <select className="text-right bg-transparent border-none text-sm">
                      <option>A-12B</option>
                      <option>A-13A</option>
                      <option>B-01C</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>
                  <Button className="w-full">
                    <Clock className="w-4 h-4 mr-2" />
                    Confirm Payment
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}