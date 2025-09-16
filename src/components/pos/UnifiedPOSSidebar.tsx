import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  UtensilsCrossed,
  BarChart3, 
  Settings,
  Store,
  ClipboardList,
  QrCode,
  CreditCard,
  Users,
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/AuthProvider';

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
  badge?: string;
  variant?: 'default' | 'vendor';
}

const vendorSidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/vendor-portal?tab=dashboard', variant: 'vendor' },
  { icon: ClipboardList, label: 'Orders', href: '/vendor-portal?tab=orders', variant: 'vendor' },
  { icon: UtensilsCrossed, label: 'Menu', href: '/vendor-portal?tab=menu', variant: 'vendor' },
  { icon: ShoppingCart, label: 'POS', href: '/vendor-portal?tab=pos', variant: 'vendor' },
  { icon: BarChart3, label: 'Analytics', href: '/vendor-portal?tab=analytics', variant: 'vendor' },
  { icon: Store, label: 'Store Setup', href: '/vendor-portal?tab=store', variant: 'vendor' },
  { icon: QrCode, label: 'QR Code', href: '/vendor-portal?tab=qr', variant: 'vendor' },
];

const posSidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/pos/dashboard' },
  { icon: ShoppingCart, label: 'Menu Order', href: '/pos' },
  { icon: BarChart3, label: 'Analytics', href: '/pos/analytics' },
  { icon: CreditCard, label: 'Payments', href: '/pos/payments' },
  { icon: Users, label: 'Customers', href: '/pos/customers' },
];

interface UnifiedPOSSidebarProps {
  variant?: 'pos' | 'vendor';
  vendorInfo?: {
    name: string;
    logo_url?: string;
  };
}

export const UnifiedPOSSidebar: React.FC<UnifiedPOSSidebarProps> = ({ 
  variant = 'pos',
  vendorInfo 
}) => {
  const location = useLocation();
  const { signOut } = useAuth();
  
  const sidebarItems = variant === 'vendor' ? vendorSidebarItems : posSidebarItems;
  
  const isActiveRoute = (href: string) => {
    if (variant === 'vendor') {
      const url = new URL(href, window.location.origin);
      const tab = url.searchParams.get('tab');
      const currentTab = new URLSearchParams(location.search).get('tab');
      return currentTab === tab;
    }
    return location.pathname === href;
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          {vendorInfo?.logo_url ? (
            <img 
              src={vendorInfo.logo_url} 
              alt={vendorInfo.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                {variant === 'vendor' ? vendorInfo?.name?.[0] || 'V' : 'P'}
              </span>
            </div>
          )}
          <div>
            <span className="font-semibold text-lg">
              {variant === 'vendor' ? vendorInfo?.name || 'Vendor Portal' : 'Pospay'}
            </span>
            <p className="text-muted-foreground text-sm">
              {variant === 'vendor' ? 'Vendor Management' : 'POS System'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        <div className="px-3 space-y-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between space-x-3 px-3 py-2.5 rounded-lg transition-colors group",
                  isActiveRoute(item.href) || isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.badge && (
                <Badge variant="secondary" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </NavLink>
          ))}
        </div>
        
        <Separator className="my-4 mx-3" />
        
        {/* Settings Section */}
        <div className="px-3 space-y-1">
          <NavLink
            to={variant === 'vendor' ? '/vendor-portal?tab=settings' : '/pos/settings'}
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </NavLink>
          
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 px-3 py-2.5 h-auto text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};