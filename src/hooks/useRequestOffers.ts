import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

export interface RequestOffer {
  id: string;
  request_id: string;
  expires_at: string;
  status: 'open' | 'claimed' | 'expired' | 'cancelled';
  request: {
    title: string;
    priority: string;
    location: string;
    category: {
      name: string;
    };
  };
}

export const useRequestOffers = () => {
  const [offers, setOffers] = useState<RequestOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchOffers = async () => {
    if (!user || !user.id) return;

    try {
      // First get the offer IDs for this user
      const { data: recipientData, error: recipientError } = await supabase
        .from('request_offer_recipients')
        .select('offer_id')
        .eq('user_id', user.id);

      if (recipientError) throw recipientError;

      const offerIds = recipientData?.map(r => r.offer_id) || [];

      if (offerIds.length === 0) {
        setOffers([]);
        return;
      }

      // Then get the offers with request details
      const { data, error } = await supabase
        .from('request_offers')
        .select(`
          id,
          request_id,
          expires_at,
          status,
          request:maintenance_requests!inner(
            title,
            priority,
            location,
            category:maintenance_categories(name)
          )
        `)
        .in('id', offerIds)
        .eq('status', 'open')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      
      const typedOffers = (data || []).map(offer => ({
        ...offer,
        status: offer.status as 'open' | 'claimed' | 'expired' | 'cancelled'
      }));
      
      setOffers(typedOffers);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptOffer = async (requestId: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_request_offer', {
        p_request_id: requestId
      });

      if (error) throw error;

      const result = data as { success: boolean; reason?: string; claimed_at?: string };

      if (result.success) {
        toast({
          title: "Task Claimed!",
          description: "You have successfully claimed this task.",
        });
        // Remove the accepted offer from the list
        setOffers(prev => prev.filter(offer => offer.request_id !== requestId));
        return true;
      } else {
        let message = "Failed to claim task.";
        if (result.reason === 'already_claimed') {
          message = "Someone else already claimed this task.";
        } else if (result.reason === 'offer_not_found_or_expired') {
          message = "This offer has expired.";
        }
        
        toast({
          title: "Unable to Claim",
          description: message,
          variant: "destructive"
        });
        
        // Refresh offers to get current state
        await fetchOffers();
        return false;
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
      toast({
        title: "Error",
        description: "An error occurred while claiming the task.",
        variant: "destructive"
      });
      return false;
    }
  };

  const declineOffer = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('decline_request_offer', {
        p_request_id: requestId
      });

      if (error) throw error;

      // Remove the declined offer from the list
      setOffers(prev => prev.filter(offer => offer.request_id !== requestId));
      
      toast({
        title: "Task Declined",
        description: "You have declined this task offer.",
      });
    } catch (error) {
      console.error('Error declining offer:', error);
      toast({
        title: "Error",
        description: "An error occurred while declining the task.",
        variant: "destructive"
      });
    }
  };

  // Set up real-time subscription for new offers
  useEffect(() => {
    if (!user?.id) return;

    fetchOffers();

    const channel = supabase
      .channel('request-offers-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'request_offer_recipients',
          filter: `user_id=eq.${user.id}`
        },
        async () => {
          // Fetch fresh offers when new ones are received
          await fetchOffers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'request_offers'
        },
        (payload) => {
          const updatedOffer = payload.new as any;
          if (updatedOffer.status !== 'open') {
            // Remove offers that are no longer open
            setOffers(prev => prev.filter(offer => offer.id !== updatedOffer.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    offers,
    isLoading,
    acceptOffer,
    declineOffer,
    refetchOffers: fetchOffers
  };
};