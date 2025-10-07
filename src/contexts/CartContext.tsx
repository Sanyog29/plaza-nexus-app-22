import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  vendor_id: string;
  dietary_tags?: string[];
  stock_quantity: number;
  low_stock_threshold: number;
}

export interface Cart {
  vendor_id: string | null;
  vendor_name: string | null;
  items: CartItem[];
  total: number;
  itemCount: number;
}

interface CartState {
  cart: Cart;
}

type CartAction = 
  | { type: 'ADD_ITEM'; payload: { item: CartItem; vendorName: string } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: Cart };

const initialState: CartState = {
  cart: {
    vendor_id: null,
    vendor_name: null,
    items: [],
    total: 0,
    itemCount: 0,
  }
};

const calculateCartTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { item, vendorName } = action.payload;
      const currentCart = state.cart;

      // Check if adding from different vendor
      if (currentCart.vendor_id && currentCart.vendor_id !== item.vendor_id) {
        toast.error("Different Vendor", {
          description: "You can only order from one vendor at a time. Clear your cart to order from a different vendor.",
        });
        return state;
      }

      // Check stock availability
      if (item.stock_quantity <= item.low_stock_threshold) {
        toast.error("Out of Stock", {
          description: `${item.name} is currently out of stock.`,
        });
        return state;
      }

      const existingItemIndex = currentCart.items.findIndex(i => i.id === item.id);
      let newItems: CartItem[];

      if (existingItemIndex >= 0) {
        // Update existing item
        const existingItem = currentCart.items[existingItemIndex];
        const newQuantity = existingItem.quantity + item.quantity;
        
        // Check if new quantity exceeds stock
        if (newQuantity > item.stock_quantity) {
          toast.error("Insufficient Stock", {
            description: `Only ${item.stock_quantity} items available.`,
          });
          return state;
        }

        newItems = currentCart.items.map((cartItem, index) =>
          index === existingItemIndex 
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        );
      } else {
        // Add new item
        newItems = [...currentCart.items, item];
      }

      const { total, itemCount } = calculateCartTotals(newItems);

      const newCart = {
        vendor_id: item.vendor_id,
        vendor_name: vendorName,
        items: newItems,
        total,
        itemCount,
      };

      toast.success(`${item.name} added to cart`, {
        duration: 2000,
      });

      return { cart: newCart };
    }

    case 'REMOVE_ITEM': {
      const newItems = state.cart.items.filter(item => item.id !== action.payload.itemId);
      const { total, itemCount } = calculateCartTotals(newItems);

      const newCart = {
        ...state.cart,
        items: newItems,
        total,
        itemCount,
        // Clear vendor if no items left
        vendor_id: newItems.length === 0 ? null : state.cart.vendor_id,
        vendor_name: newItems.length === 0 ? null : state.cart.vendor_name,
      };

      return { cart: newCart };
    }

    case 'UPDATE_QUANTITY': {
      const { itemId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { itemId } });
      }

      const newItems = state.cart.items.map(item => {
        if (item.id === itemId) {
          // Check stock availability
          if (quantity > item.stock_quantity) {
            toast.error("Insufficient Stock", {
              description: `Only ${item.stock_quantity} items available.`,
            });
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      });

      const { total, itemCount } = calculateCartTotals(newItems);

      const newCart = {
        ...state.cart,
        items: newItems,
        total,
        itemCount,
      };

      return { cart: newCart };
    }

    case 'CLEAR_CART':
      return { cart: initialState.cart };

    case 'LOAD_CART':
      return { cart: action.payload };

    default:
      return state;
  }
};

interface CartContextType {
  cart: Cart;
  addItem: (item: CartItem, vendorName: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('customer-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('customer-cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('customer-cart', JSON.stringify(state.cart));
  }, [state.cart]);

  const addItem = (item: CartItem, vendorName: string) => {
    dispatch({ type: 'ADD_ITEM', payload: { item, vendorName } });
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId } });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.success("Cart cleared", {
      duration: 2000,
    });
  };

  return (
    <CartContext.Provider value={{
      cart: state.cart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};