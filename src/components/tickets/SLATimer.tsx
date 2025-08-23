import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle } from 'lucide-react';

interface SLATimerProps {
  slaBreachAt?: string;
  nextEscalationAt?: string;
  status: string;
  priority: string;
  isAcknowledged?: boolean;
}

const SLATimer: React.FC<SLATimerProps> = ({
  slaBreachAt,
  nextEscalationAt,
  status,
  priority,
  isAcknowledged = false
}) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isBreached, setIsBreached] = useState(false);
  const [severity, setSeverity] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const updateTimer = () => {
      const targetTime = isAcknowledged ? slaBreachAt : nextEscalationAt;
      
      if (!targetTime || status === 'completed' || status === 'cancelled') {
        setTimeRemaining('');
        return;
      }

      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsBreached(true);
        setTimeRemaining('OVERDUE');
        setSeverity('critical');
        return;
      }

      setIsBreached(false);
      
      // Calculate time remaining
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }

      // Set severity based on time remaining and priority
      const totalMinutes = Math.floor(difference / (1000 * 60));
      const priorityThresholds = {
        critical: { warning: 5, critical: 2 },
        high: { warning: 15, critical: 5 },
        medium: { warning: 60, critical: 15 },
        low: { warning: 240, critical: 60 }
      };

      const thresholds = priorityThresholds[priority as keyof typeof priorityThresholds] || 
                        priorityThresholds.medium;

      if (totalMinutes <= thresholds.critical) {
        setSeverity('critical');
      } else if (totalMinutes <= thresholds.warning) {
        setSeverity('warning');
      } else {
        setSeverity('normal');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [slaBreachAt, nextEscalationAt, status, priority, isAcknowledged]);

  if (!timeRemaining || status === 'completed' || status === 'cancelled') {
    return null;
  }

  const getVariant = () => {
    if (isBreached) return 'destructive';
    if (severity === 'critical') return 'destructive';
    if (severity === 'warning') return 'secondary';
    return 'outline';
  };

  const getIcon = () => {
    if (isBreached || severity === 'critical') return <AlertTriangle className="h-3 w-3" />;
    return <Clock className="h-3 w-3" />;
  };

  const getLabel = () => {
    if (isBreached) return 'OVERDUE';
    if (isAcknowledged) return 'SLA';
    return 'Response';
  };

  return (
    <Badge variant={getVariant()} className="flex items-center gap-1 animate-pulse-slow">
      {getIcon()}
      <span className="font-mono text-xs">
        {getLabel()}: {timeRemaining}
      </span>
    </Badge>
  );
};

export default SLATimer;