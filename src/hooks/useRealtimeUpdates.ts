import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

interface RealtimeOptions {
  table: TableName;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  queryKeysToInvalidate?: string[][];
}

export function useRealtimeUpdates({
  table,
  event = '*',
  filter,
  queryKeysToInvalidate = []
}: RealtimeOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          filter,
        } as any,
        () => {
          // Invalidate related queries to refetch data
          queryKeysToInvalidate.forEach(queryKey => {
            queryClient.invalidateQueries({ queryKey });
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, queryClient, queryKeysToInvalidate]);

  return { isConnected };
}

// Predefined realtime hooks for common use cases
export function useRealtimeRequests(userId?: string) {
  return useRealtimeUpdates({
    table: 'maintenance_requests',
    queryKeysToInvalidate: [
      ['requests'],
      ...(userId ? [['requests', 'user', userId]] : []),
      ['metrics'],
    ],
  });
}

export function useRealtimeAlerts() {
  return useRealtimeUpdates({
    table: 'alerts',
    queryKeysToInvalidate: [
      ['alerts'],
    ],
  });
}

export function useRealtimeUserPresence(roomId: string) {
  const [presenceState, setPresenceState] = useState<Record<string, any>>({});
  
  useEffect(() => {
    const channel = supabase.channel(`presence-${roomId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setPresenceState(newState);
      })
      .on('presence', { event: 'join' }, () => {
        // User joined presence
      })
      .on('presence', { event: 'leave' }, () => {
        // User left presence
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const trackPresence = async (userData: Record<string, any>) => {
    const channel = supabase.channel(`presence-${roomId}`);
    await channel.track(userData);
  };

  return { presenceState, trackPresence };
}