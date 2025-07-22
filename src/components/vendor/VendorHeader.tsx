import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  HelpCircle,
  Store,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface VendorHeaderProps {
  vendor: any;
  pendingOrdersCount?: number;
}

const VendorHeader: React.FC<VendorHeaderProps> = ({ vendor, pendingOrdersCount = 0 }) => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Brand/Vendor Info */}
          <div className="flex items-center gap-4">
            <Link to="/vendor-portal" className="flex items-center gap-3">
              {vendor.logo_url && (
                <img 
                  src={vendor.logo_url} 
                  alt={vendor.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-border"
                />
              )}
              <div>
                <h1 className="text-lg font-bold text-foreground">{vendor.name}</h1>
                <p className="text-sm text-muted-foreground">{vendor.cuisine_type}</p>
              </div>
            </Link>
            <Badge variant={vendor.is_active ? 'default' : 'secondary'} className="ml-2">
              {vendor.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Center: Quick Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vendor-portal?tab=dashboard">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vendor-portal?tab=orders">
                <Store className="h-4 w-4 mr-2" />
                Orders
                {pendingOrdersCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 text-xs">
                    {pendingOrdersCount}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vendor-portal?tab=menu">
                Menu
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vendor-portal?tab=analytics">
                Analytics
              </Link>
            </Button>
          </nav>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {pendingOrdersCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {pendingOrdersCount > 0 ? (
                  <DropdownMenuItem asChild>
                    <Link to="/vendor-portal?tab=orders">
                      <Store className="h-4 w-4 mr-2" />
                      {pendingOrdersCount} pending order{pendingOrdersCount !== 1 ? 's' : ''}
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>
                    No new notifications
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="Profile" />
                    <AvatarFallback>
                      {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'V'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/vendor-portal?tab=settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Vendor Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/manual">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default VendorHeader;