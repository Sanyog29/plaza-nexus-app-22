import React from 'react';
import { ChevronDown, Bell, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export const POSHeader = () => {
  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <header className="bg-background border-b border-border p-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Vendor Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-orange-500 rounded-full"></div>
            <span className="font-semibold text-lg">Hadid's Food</span>
          </div>
          
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Open</span>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Right Section - Date, Time, User */}
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{currentDate} at {currentTime}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeToggle />
            
            <Button variant="ghost" size="sm">
              <Bell className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <span className="font-medium">{user?.email?.split('@')[0] || 'User'}</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};