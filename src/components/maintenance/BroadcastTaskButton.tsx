
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Radio, AlertTriangle } from 'lucide-react';

interface BroadcastTaskButtonProps {
  requestId: string;
  requestStatus: string;
  assignedTo?: string;
  onSuccess?: () => void;
}

const BroadcastTaskButton: React.FC<BroadcastTaskButtonProps> = ({
  requestId,
  requestStatus,
  assignedTo,
  onSuccess
}) => {
  const [broadcasting, setBroadcasting] = useState(false);
  const { toast } = useToast();

  const handleBroadcast = async () => {
    setBroadcasting(true);
    
    try {
      const { data, error } = await supabase.rpc('broadcast_request_offer', {
        p_request_id: requestId,
        p_expires_in_minutes: 5
      });

      if (error) throw error;

      if (data && typeof data === 'object' && 'success' in data && data.success) {
        toast({
          title: "✅ Task Broadcasted",
          description: `Task offer sent to ${(data as any).recipients_count || 0} field staff members`,
        });
        onSuccess?.();
      } else {
        let errorMessage = "Failed to broadcast task";
        
        if (data && typeof data === 'object' && 'reason' in data && (data as any).reason === 'request_not_available') {
          if (assignedTo) {
            errorMessage = "This request is already assigned to a technician";
          } else if (requestStatus !== 'pending') {
            errorMessage = `Cannot broadcast ${requestStatus.replace('_', ' ')} requests. Only pending requests can be broadcasted.`;
          } else {
            errorMessage = "This request is not available for broadcasting";
          }
        }
        
        toast({
          title: "Broadcast Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setBroadcasting(false);
    }
  };

  const canBroadcast = requestStatus === 'pending' && !assignedTo;

  if (!canBroadcast) {
    return (
      <Card className="bg-card/50 backdrop-blur border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">
              {assignedTo 
                ? "Task is already assigned" 
                : `Cannot broadcast ${requestStatus.replace('_', ' ')} requests`
              }
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center gap-2">
          <Radio className="w-5 h-5" />
          Broadcast to Field Staff
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-blue-300">
            Ready to Broadcast
          </Badge>
        </div>
        
        <p className="text-sm text-gray-300">
          Send this task offer to all available field staff members. First to accept will be assigned.
        </p>
        
        <Button
          onClick={handleBroadcast}
          disabled={broadcasting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Radio className="w-4 h-4 mr-2" />
          {broadcasting ? 'Broadcasting...' : 'Broadcast Task (5 min offer)'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BroadcastTaskButton;
