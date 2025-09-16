import React from 'react';
import { Search, RefreshCw, Bell, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/components/AuthProvider';

interface UnifiedPOSHeaderProps {
  variant?: 'pos' | 'vendor';
  onRefresh?: () => void;
  onSearch?: (term: string) => void;
  searchPlaceholder?: string;
  vendorInfo?: {
    name: string;
    is_active: boolean;
  };
  notifications?: number;
}

export const UnifiedPOSHeader: React.FC<UnifiedPOSHeaderProps> = ({
  variant = 'pos',
  onRefresh,
  onSearch,
  searchPlaceholder = 'Search menu items...',
  vendorInfo,
  notifications = 0
}) => {
  const { user, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  return (
    <header className="h-16 bg-background border-b border-border px-6 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {variant === 'vendor' && vendorInfo && (
          <div className="flex items-center space-x-3">
            <Select defaultValue="current-vendor">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Restaurant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-vendor">
                  <div className="flex items-center space-x-2">
                    <span>{vendorInfo.name}</span>
                    <Badge 
                      variant={vendorInfo.is_active ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {vendorInfo.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{currentDate}</span>
          <Clock className="w-4 h-4 ml-4" />
          <span>{currentTime}</span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-9 w-9 p-0"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0"
          >
            <Bell className="h-4 w-4" />
          </Button>
          {notifications > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {notifications > 9 ? '9+' : notifications}
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
                <AvatarFallback>
                  {user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
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
            <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = '/support'}>
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};