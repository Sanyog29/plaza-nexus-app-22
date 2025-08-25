import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, User, MapPin } from 'lucide-react';
import { useTimeExtensions } from '@/hooks/useTimeExtensions';

interface AssignToMeButtonProps {
  requestId: string;
  requestStatus: string;
  priority: string;
  location?: string;
  assignedTo?: string;
  userId?: string;
  isStaff: boolean;
  onSuccess?: () => void;
}

export const AssignToMeButton: React.FC<AssignToMeButtonProps> = ({
  requestId,
  requestStatus,
  priority,
  location,
  assignedTo,
  userId,
  isStaff,
  onSuccess
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { assignAndStartRequest } = useTimeExtensions();

  // Don't show button if not staff or if request is not available for assignment
  if (!isStaff || !['pending', 'assigned'].includes(requestStatus)) {
    return null;
  }

  // Don't show if already assigned to current user
  if (assignedTo === userId) {
    return null;
  }

  const handleAssignAndStart = async () => {
    setIsProcessing(true);
    const result = await assignAndStartRequest(requestId);
    
    if (result.success) {
      onSuccess?.();
    }
    setIsProcessing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'assigned': return 'default';
      default: return 'outline';
    }
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeColor(requestStatus)}>
              {requestStatus === 'pending' ? 'Available' : 'Assigned'}
            </Badge>
            <Badge variant={getPriorityColor(priority)}>
              {priority} priority
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {location}
              </div>
            )}
            
            {assignedTo && requestStatus === 'assigned' && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Currently assigned
              </div>
            )}
          </div>
          
          <p className="text-sm font-medium">
            Quick action: Assign this request to yourself and start working immediately
          </p>
        </div>
        
        <Button
          onClick={handleAssignAndStart}
          disabled={isProcessing}
          size="lg"
          className="flex items-center gap-2 font-semibold"
        >
          <Play className="h-5 w-5" />
          {isProcessing ? 'Processing...' : 'Assign to me & Start'}
        </Button>
      </div>
      
      <div className="mt-3 pt-3 border-t border-primary/10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          This will immediately assign the request to you and mark it as "In Progress"
        </div>
      </div>
    </div>
  );
};