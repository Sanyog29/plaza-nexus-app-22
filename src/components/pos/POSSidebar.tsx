import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  BarChart3, 
  Banknote, 
  Table, 
  UtensilsCrossed, 
  CreditCard, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/pos/dashboard' },
  { icon: ShoppingCart, label: 'Menu Order', href: '/pos', active: true },
  { icon: BarChart3, label: 'Analytics', href: '/pos/analytics' },
  { icon: Banknote, label: 'Withdrawal', href: '/pos/withdrawal' },
  { icon: Table, label: 'Manage Table', href: '/pos/tables' },
  { icon: UtensilsCrossed, label: 'Manage Dish', href: '/pos/dishes' },
  { icon: CreditCard, label: 'Manage Payment', href: '/pos/payments' },
  { icon: Settings, label: 'Settings', href: '/pos/settings' },
  { icon: LogOut, label: 'Logout', href: '/auth', isLogout: true },
];

export const POSSidebar = () => {
  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-lg">Pospay</span>
        </div>
        <p className="text-gray-400 text-sm mt-1">Cashier Daily Assistant</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-3">
          {sidebarItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                    isActive && !item.isLogout
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};