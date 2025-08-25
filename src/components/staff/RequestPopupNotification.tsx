import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, Clock, MapPin, AlertTriangle } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface RequestPopupNotificationProps {
  request: {
    id: string;
    title: string;
    priority: string;
    location: string;
    created_at: string;
    category?: {
      name: string;
    };
  };
  onAccept: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

export const RequestPopupNotification = ({
  request,
  onAccept,
  onDismiss,
  isVisible
}: RequestPopupNotificationProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      
      // Trigger haptic feedback
      try {
        Haptics.impact({ style: ImpactStyle.Heavy });
      } catch (error) {
        console.log('Haptic feedback not available:', error);
      }
      
      // Stop animation after 3 seconds
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Card 
        className={`
          bg-card border-primary shadow-2xl transform transition-all duration-500
          ${isAnimating ? 'animate-pulse shadow-primary/50 animate-vibrate' : ''}
          ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/20 p-2 rounded-lg">
                {getPriorityIcon(request.priority)}
              </div>
              <div>
                <h4 className="font-semibold text-sm">New Request!</h4>
                <p className="text-xs text-muted-foreground">Just received</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2 mb-4">
            <h5 className="font-medium text-sm">{request.title}</h5>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {request.location}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={getPriorityColor(request.priority)} className="text-xs">
                {request.priority}
              </Badge>
              {request.category && (
                <Badge variant="outline" className="text-xs">
                  {request.category.name}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onAccept}
              className="flex-1 h-8 text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="h-8 text-xs"
            >
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};