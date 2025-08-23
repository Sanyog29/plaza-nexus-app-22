import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TicketAcknowledgeButtonProps {
  ticketId: string;
  isAcknowledged: boolean;
  isAssignedToUser: boolean;
  onAcknowledged: () => void;
}

const TicketAcknowledgeButton: React.FC<TicketAcknowledgeButtonProps> = ({
  ticketId,
  isAcknowledged,
  isAssignedToUser,
  onAcknowledged
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAcknowledge = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('acknowledge_ticket', {
        ticket_id: ticketId
      });

      if (error) throw error;

      onAcknowledged();
      
      toast({
        title: 'Ticket Acknowledged',
        description: 'You have successfully acknowledged this ticket. SLA timer has been updated.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAssignedToUser || isAcknowledged) {
    return null;
  }

  return (
    <Button
      onClick={handleAcknowledge}
      disabled={isLoading}
      className="flex items-center gap-2"
      variant="default"
    >
      {isLoading ? (
        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        <Check className="h-4 w-4" />
      )}
      Acknowledge Ticket
    </Button>
  );
};

export default TicketAcknowledgeButton;