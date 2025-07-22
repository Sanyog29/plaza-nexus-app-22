import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, XCircle, PlayCircle } from 'lucide-react';

interface TimelineItem {
  id: string;
  status: string;
  timestamp: string;
  notes?: string;
  created_by?: string;
}

interface OrderTimelineProps {
  timeline: TimelineItem[];
  currentStatus: string;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ timeline, currentStatus }) => {
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'confirmed':
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'preparing':
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-purple-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'orange';
      case 'confirmed': 
      case 'accepted': return 'blue';
      case 'preparing':
      case 'in_progress': return 'purple';
      case 'ready': return 'green';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-muted-foreground">Order Timeline</h4>
      
      <div className="relative">
        {timeline.map((item, index) => {
          const isLast = index === timeline.length - 1;
          const isCurrent = item.status.toLowerCase() === currentStatus.toLowerCase();
          
          return (
            <div key={item.id} className="flex items-start space-x-3 relative">
              {/* Timeline line */}
              {!isLast && (
                <div className="absolute left-2 top-8 w-0.5 h-6 bg-border" />
              )}
              
              {/* Status icon */}
              <div className={`flex-shrink-0 w-4 h-4 mt-1 ${isCurrent ? 'animate-pulse' : ''}`}>
                {getStatusIcon(item.status)}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={isCurrent ? 'default' : 'secondary'}
                    className={`text-xs ${isCurrent ? 'animate-pulse' : ''}`}
                  >
                    {formatStatus(item.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                
                {item.notes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;