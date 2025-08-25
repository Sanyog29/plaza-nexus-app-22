import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';

interface NewRequest {
  id: string;
  title: string;
  priority: string;
  location: string;
  created_at: string;
  category?: {
    name: string;
  };
}

export const useNewRequestNotifications = () => {
  const [newRequest, setNewRequest] = useState<NewRequest | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Set up real-time subscription for new requests
    const channel = supabase
      .channel('new-requests-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'maintenance_requests'
        },
        async (payload) => {
          const newRequestData = payload.new as any;
          
          // Fetch the complete request data with category
          const { data: requestWithCategory } = await supabase
            .from('maintenance_requests')
            .select(`
              id,
              title,
              priority,
              location,
              created_at,
              category:maintenance_categories(name)
            `)
            .eq('id', newRequestData.id)
            .single();

          if (requestWithCategory) {
            setNewRequest(requestWithCategory);
            setIsVisible(true);
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
              setIsVisible(false);
            }, 10000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleAccept = () => {
    if (newRequest) {
      // Navigate to the request details or take action
      window.location.href = `/staff/requests/${newRequest.id}`;
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const clearNotification = () => {
    setNewRequest(null);
    setIsVisible(false);
  };

  return {
    newRequest,
    isVisible,
    handleAccept,
    handleDismiss,
    clearNotification
  };
};