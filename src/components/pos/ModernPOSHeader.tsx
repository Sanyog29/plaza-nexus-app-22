import React, { useState, useEffect } from 'react';
import { Clock, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModernPOSHeaderProps {
  customerName?: string;
  orderNumber?: string;
  onCloseOrder?: () => void;
}

export const ModernPOSHeader: React.FC<ModernPOSHeaderProps> = ({
  customerName = "Walk-in Customer",
  orderNumber = "001",
  onCloseOrder
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left section - Date and Time */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium text-foreground">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(currentTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Center section - Customer info */}
        <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium text-foreground">
              {customerName}
            </div>
            <div className="text-xs text-muted-foreground">
              Order #{orderNumber}
            </div>
          </div>
        </div>

        {/* Right section - Close Order */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onCloseOrder}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Close Order
          </Button>
        </div>
      </div>
    </div>
  );
};