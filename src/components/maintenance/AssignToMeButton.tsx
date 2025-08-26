import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
interface AssignToMeButtonProps {
  requestId: string;
  requestStatus: string;
  priority: string;
  location: string;
  assignedTo: string | null;
  userId: string | undefined;
  isStaff: boolean;
  onSuccess?: () => void;
}
export const AssignToMeButton = ({
  requestId,
  requestStatus,
  priority,
  location,
  assignedTo,
  userId,
  isStaff,
  onSuccess
}: AssignToMeButtonProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    toast
  } = useToast();

  // Show "Assigned" badge if already assigned
  if (assignedTo) {
    return <div className="mb-6">
        
      </div>;
  }

  // Only show button for staff when request is unassigned
  if (!isStaff || !userId || requestStatus !== 'pending') {
    return null;
  }
  const handleAssignToMe = async () => {
    setIsProcessing(true);
    try {
      const {
        error
      } = await supabase.from('maintenance_requests').update({
        assigned_to: userId,
        assigned_at: new Date().toISOString(),
        status: 'assigned'
      }).eq('id', requestId).is('assigned_to', null);
      if (error) throw error;
      toast({
        title: "Request Assigned",
        description: "You have been assigned to this maintenance request."
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error assigning request:', error);
      toast({
        title: "Error",
        description: "Failed to assign request. It may have already been assigned.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  return <div className="mb-6">
      <Button onClick={handleAssignToMe} disabled={isProcessing} className="gap-2" size="lg">
        {isProcessing ? <>
            <div className="animate-spin h-4 w-4 rounded-full border-2 border-transparent border-t-current" />
            Assigning...
          </> : <>
            <User className="h-4 w-4" />
            Assign to Me
          </>}
      </Button>
    </div>;
};