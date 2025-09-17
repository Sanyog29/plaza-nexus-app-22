import React, { useState, useEffect } from 'react';
import { Clock, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface ModernPOSHeaderProps {
  customerName?: string;
  orderNumber?: string;
  onCloseOrder?: () => void;
  onBackToPortal?: () => void;
}
export const ModernPOSHeader: React.FC<ModernPOSHeaderProps> = ({
  customerName = "Walk-in Customer",
  orderNumber = "001",
  onCloseOrder,
  onBackToPortal
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
    <header className="flex items-center justify-between p-4 bg-background border-b border-border">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-foreground">Order #{orderNumber}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{customerName}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(currentTime)}</span>
          </div>
          <span className="text-muted-foreground">{formatDate(currentTime)}</span>
        </div>

        {onBackToPortal && (
          <Button variant="outline" size="sm" onClick={onBackToPortal}>
            Back to Portal
          </Button>
        )}

        {onCloseOrder && (
          <Button variant="outline" size="sm" onClick={onCloseOrder}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </header>
  );
};