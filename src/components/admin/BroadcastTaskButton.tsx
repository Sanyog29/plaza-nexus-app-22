import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, Users, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BroadcastTaskButtonProps {
  requestId: string;
  requestTitle: string;
  isAssigned: boolean;
  disabled?: boolean;
}

export const BroadcastTaskButton = ({ 
  requestId, 
  requestTitle, 
  isAssigned, 
  disabled 
}: BroadcastTaskButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [expiryMinutes, setExpiryMinutes] = useState('2');
  const { toast } = useToast();

  const handleBroadcast = async () => {
    if (isAssigned) {
      toast({
        title: "Task Already Assigned",
        description: "This task is already assigned to someone.",
        variant: "destructive"
      });
      return;
    }

    setIsBroadcasting(true);
    try {
      const { data, error } = await supabase.rpc('broadcast_request_offer', {
        p_request_id: requestId,
        p_expires_in_minutes: parseInt(expiryMinutes)
      });

      if (error) throw error;

      const result = data as { success: boolean; reason?: string; recipients_count?: number };

      if (result.success) {
        toast({
          title: "Task Broadcasted!",
          description: `Task sent to ${result.recipients_count || 0} field staff members. They have ${expiryMinutes} minutes to respond.`,
        });
        setIsOpen(false);
      } else {
        toast({
          title: "Broadcast Failed",
          description: result.reason === 'request_not_available' 
            ? "This request is not available for broadcasting."
            : "Failed to broadcast task. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error broadcasting task:', error);
      toast({
        title: "Error",
        description: "An error occurred while broadcasting the task.",
        variant: "destructive"
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  if (isAssigned) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Users className="h-3 w-3" />
        Assigned
      </Badge>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Radio className="h-4 w-4" />
          Broadcast to L1
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Broadcast Task to Field Staff</DialogTitle>
          <DialogDescription>
            Send this task to all available L1 field staff. The first to accept will be assigned.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Task Details</h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
              {requestTitle}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              Response Time Limit
            </label>
            <Select value={expiryMinutes} onValueChange={setExpiryMinutes}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute</SelectItem>
                <SelectItem value="2">2 minutes</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Field staff will have this amount of time to accept the task.
            </p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isBroadcasting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBroadcast}
              disabled={isBroadcasting}
              className="gap-2"
            >
              {isBroadcasting ? (
                <>
                  <div className="animate-spin h-4 w-4 rounded-full border-2 border-transparent border-t-current" />
                  Broadcasting...
                </>
              ) : (
                <>
                  <Radio className="h-4 w-4" />
                  Broadcast Task
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};