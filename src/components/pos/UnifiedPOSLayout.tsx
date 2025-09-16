import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Menu as MenuIcon, 
  BarChart3, 
  CreditCard, 
  Table2, 
  ChefHat, 
  Settings, 
  LogOut,
  Search,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface UnifiedPOSLayoutProps {
  children: React.ReactNode;
  vendorId?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/vendor-portal?tab=dashboard', icon: LayoutDashboard },
  { name: 'Menu Order', href: '/vendor-portal?tab=pos', icon: ShoppingCart },
  { name: 'Analytics', href: '/vendor-portal?tab=analytics', icon: BarChart3 },
  { name: 'Withdrawal', href: '/vendor-portal?tab=withdrawal', icon: CreditCard },
  { name: 'Manage Table', href: '/vendor-portal?tab=tables', icon: Table2 },
  { name: 'Manage Dish', href: '/vendor-portal?tab=menu', icon: ChefHat },
  { name: 'Manage Payment', href: '/vendor-portal?tab=payments', icon: CreditCard },
];

function POSSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname + location.search;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;

  return (
    <Sidebar className={`${collapsed ? 'w-16' : 'w-64'} border-r bg-background`} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-lg font-semibold">
            {!collapsed && 'Pospay'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton asChild className={isActive(item.href) ? 'bg-accent text-accent-foreground' : ''}>
                    <NavLink to={item.href} className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors">
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/vendor-portal?tab=settings" className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors">
                    <Settings className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full text-left text-destructive hover:bg-destructive/10">
                    <LogOut className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="text-sm font-medium">Logout</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function POSTopbar() {
  const [selectedVendor, setSelectedVendor] = useState('restaurant-alpha');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        
        {/* Restaurant/Vendor Selection */}
        <div className="flex items-center gap-3">
          <Select value={selectedVendor} onValueChange={setSelectedVendor}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restaurant-alpha">Restaurant Alpha</SelectItem>
              <SelectItem value="cafe-beta">Cafe Beta</SelectItem>
              <SelectItem value="bakery-gamma">Bakery Gamma</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            Active
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-64"
          />
        </div>

        {/* Date/Time and Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date().toLocaleDateString()}
          </Button>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* User Avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="User" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs leading-none text-muted-foreground">
                  john@example.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export const UnifiedPOSLayout: React.FC<UnifiedPOSLayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <POSSidebar />
        <div className="flex-1 flex flex-col">
          <POSTopbar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};