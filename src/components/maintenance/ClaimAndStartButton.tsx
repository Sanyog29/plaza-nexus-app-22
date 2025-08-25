import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Users } from 'lucide-react';
import { useTimeExtensions } from '@/hooks/useTimeExtensions';
import { useToast } from '@/hooks/use-toast';

interface ClaimAndStartButtonProps {
  requestId: string;
  requestStatus: string;
  assignedTo: string | null;
  userId: string | undefined;
  isStaff: boolean;
  onSuccess?: () => void;
}

export const ClaimAndStartButton = ({ 
  requestId, 
  requestStatus, 
  assignedTo, 
  userId, 
  isStaff, 
  onSuccess 
}: ClaimAndStartButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { assignAndStartRequest } = useTimeExtensions();
  const { toast } = useToast();

  // Show "Assigned" badge if already assigned
  if (assignedTo) {
    return (
      <div className="mb-6">
        <Badge variant="secondary" className="gap-2">
          <Users className="h-4 w-4" />
          Assigned
        </Badge>
      </div>
    );
  }

  // Only show button for staff when request is unassigned and in claimable status
  if (!isStaff || !userId || !['pending', 'assigned'].includes(requestStatus)) {
    return null;
  }

  const handleClaimAndStart = async () => {
    setIsProcessing(true);
    try {
      await assignAndStartRequest(requestId);
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Error claiming request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mb-6">
      <Button 
        onClick={handleClaimAndStart}
        disabled={isProcessing}
        className="gap-2"
        size="lg"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin h-4 w-4 rounded-full border-2 border-transparent border-t-current" />
            Claiming...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Claim & Start Work
          </>
        )}
      </Button>
    </div>
  );
};