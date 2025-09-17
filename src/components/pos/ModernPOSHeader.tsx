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
  return;
};