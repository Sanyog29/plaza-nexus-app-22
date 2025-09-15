import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VendorRealtimeOptions {
  vendorId: string;
  onOrderUpdate?: () => void;
  onOrderCompleted?: (order: any) => void;
}

export const useVendorRealtime = ({ 
  vendorId, 
  onOrderUpdate, 
  onOrderCompleted 
}: VendorRealtimeOptions) => {
  useEffect(() => {
    if (!vendorId) return;

    // Subscribe to real-time updates for vendor orders
    const channel = supabase
      .channel(`vendor-orders-${vendorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cafeteria_orders',
          filter: `vendor_id=eq.${vendorId}`
        },
        (payload) => {
          console.log('Order update received:', payload);
          
          if (onOrderUpdate) {
            onOrderUpdate();
          }
          
          // Handle completed orders specifically
          if (payload.eventType === 'UPDATE' && 
              payload.new?.status === 'completed' && 
              payload.old?.status !== 'completed') {
            if (onOrderCompleted) {
              onOrderCompleted(payload.new);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vendorId, onOrderUpdate, onOrderCompleted]);
};