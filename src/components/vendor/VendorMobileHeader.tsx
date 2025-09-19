import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X,
  LayoutDashboard,
  ShoppingBag,
  ChefHat,
  CreditCard,
  Settings,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VendorMobileHeaderProps {
  vendor: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingOrdersCount?: number;
}

const navigation = [
  { name: 'Dashboard', value: 'dashboard', icon: LayoutDashboard },
  { name: 'Orders', value: 'orders', icon: ShoppingBag },
  { name: 'Menu', value: 'menu', icon: ChefHat },
  { name: 'POS System', value: 'pos', icon: CreditCard },
  { name: 'Store Setup', value: 'store', icon: Settings },
  { name: 'Sales', value: 'sales', icon: TrendingUp },
  { name: 'Analytics', value: 'analytics', icon: BarChart3 },
];

export const VendorMobileHeader: React.FC<VendorMobileHeaderProps> = ({
  vendor,
  activeTab,
  onTabChange,
  pendingOrdersCount = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTabSelect = (tab: string) => {
    onTabChange(tab);
    setIsOpen(false);
  };

  const currentTab = navigation.find(item => item.value === activeTab);

  return (
    <div className="lg:hidden bg-card border-b p-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <SheetHeader>
              <SheetTitle className="text-left">Vendor Portal</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-1">
              {navigation.map((item) => (
                <button
                  key={item.value}
                  onClick={() => handleTabSelect(item.value)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-md transition-colors text-left",
                    activeTab === item.value
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                  {item.value === 'orders' && pendingOrdersCount > 0 && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      {pendingOrdersCount}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
        
        <div>
          <h1 className="font-semibold text-lg">{currentTab?.name || 'Vendor Portal'}</h1>
          <p className="text-sm text-muted-foreground">{vendor?.name || 'Restaurant'}</p>
        </div>
      </div>
      
      {pendingOrdersCount > 0 && (
        <Badge variant="destructive" className="ml-auto">
          {pendingOrdersCount} pending
        </Badge>
      )}
    </div>
  );
};