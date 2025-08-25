import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, MapPin, Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ClaimedTaskBannerProps {
  request: {
    id: string;
    title: string;
    status: string;
    priority: string;
    location: string;
    sla_breach_at: string | null;
    assignment_acknowledged_at: string | null;
  };
  onMarkInProgress?: () => void;
  onUploadPhotos?: () => void;
  isProcessing?: boolean;
}

export const ClaimedTaskBanner = ({ 
  request, 
  onMarkInProgress, 
  onUploadPhotos,
  isProcessing = false 
}: ClaimedTaskBannerProps) => {
  const getSlaStatus = () => {
    if (!request.sla_breach_at) return null;
    
    const breachTime = new Date(request.sla_breach_at);
    const now = new Date();
    const timeRemaining = breachTime.getTime() - now.getTime();
    
    if (timeRemaining <= 0) {
      return { status: 'breached', color: 'destructive', text: 'SLA Breached' };
    } else if (timeRemaining <= 30 * 60 * 1000) { // 30 minutes
      return { 
        status: 'critical', 
        color: 'destructive', 
        text: `SLA: ${Math.ceil(timeRemaining / (1000 * 60))}m remaining` 
      };
    } else {
      return { 
        status: 'normal', 
        color: 'secondary', 
        text: `SLA: ${formatDistanceToNow(breachTime)} remaining` 
      };
    }
  };

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

  const slaStatus = getSlaStatus();
  const isStarted = request.status === 'in_progress' || request.status === 'completed';
  const claimedAt = request.assignment_acknowledged_at ? new Date(request.assignment_acknowledged_at) : new Date();

  return (
    <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Task Claimed</h3>
              <Badge variant="outline" className="text-primary border-primary">
                You're assigned
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Claimed {formatDistanceToNow(claimedAt)} ago
            </p>
          </div>
          
          <div className="flex gap-2">
            <Badge variant={getPriorityColor(request.priority)}>
              {request.priority}
            </Badge>
            {slaStatus && (
              <Badge variant={slaStatus.color as any}>
                <Clock className="h-3 w-3 mr-1" />
                {slaStatus.text}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {request.location}
          </div>
        </div>

        {!isStarted ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">Ready to upload photos?</p>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={onUploadPhotos}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Upload Photos
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Task in progress</p>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={onUploadPhotos}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Upload Progress Photos
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};