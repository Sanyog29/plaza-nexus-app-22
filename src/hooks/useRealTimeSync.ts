import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface RealTimeSyncOptions {
  table: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
}

export function useRealTimeSync(options: RealTimeSyncOptions) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const { table, filter, onInsert, onUpdate, onDelete } = options;

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          setLastUpdate(new Date());
          onInsert?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          setLastUpdate(new Date());
          onUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          setLastUpdate(new Date());
          onDelete?.(payload);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR') {
          toast({
            title: "Connection Error",
            description: "Real-time sync encountered an error",
            variant: "destructive"
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [user, table, filter, onInsert, onUpdate, onDelete]);

  return { isConnected, lastUpdate };
}

// Hook for real-time presence tracking
export function usePresence(room: string) {
  const { user } = useAuth();
  const [presenceState, setPresenceState] = useState<any>({});
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel(room);

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setPresenceState(newState);
        
        // Extract online users
        const users = Object.entries(newState).flatMap(([key, presence]: [string, any]) => 
          presence.map((p: any) => p)
        );
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;

        // Track current user presence
        const userStatus = {
          user_id: user.id,
          email: user.email,
          joined_at: new Date().toISOString(),
          status: 'online'
        };

        await channel.track(userStatus);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, room]);

  const updateStatus = useCallback(async (status: any) => {
    const channel = supabase.channel(room);
    await channel.track({ ...status, user_id: user?.id });
  }, [room, user]);

  return { 
    presenceState, 
    onlineUsers, 
    updateStatus 
  };
}

// Hook for real-time message broadcasting
export function useBroadcast(room: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(room)
      .on('broadcast', { event: 'message' }, (payload) => {
        setMessages(prev => [...prev, payload.payload]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, room]);

  const sendMessage = useCallback(async (message: any) => {
    const channel = supabase.channel(room);
    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        ...message,
        user_id: user?.id,
        timestamp: new Date().toISOString()
      }
    });
  }, [room, user]);

  return { messages, sendMessage };
}

// Hook for system-wide status monitoring
export function useSystemStatus() {
  const [systemMetrics, setSystemMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingRequests: 0,
    systemHealth: 'healthy' as 'healthy' | 'warning' | 'error'
  });

  useRealTimeSync({
    table: 'maintenance_requests',
    onInsert: () => {
      setSystemMetrics(prev => ({
        ...prev,
        pendingRequests: prev.pendingRequests + 1
      }));
    },
    onUpdate: (payload) => {
      if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
        setSystemMetrics(prev => ({
          ...prev,
          pendingRequests: Math.max(0, prev.pendingRequests - 1)
        }));
      }
    }
  });

  return systemMetrics;
}

// Hook for connection quality monitoring
export function useConnectionQuality() {
  const [quality, setQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('excellent');
  const [latency, setLatency] = useState<number>(0);

  useEffect(() => {
    const checkConnection = async () => {
      const start = Date.now();
      try {
        await supabase.from('profiles').select('id').limit(1);
        const end = Date.now();
        const responseTime = end - start;
        
        setLatency(responseTime);
        
        if (responseTime < 100) setQuality('excellent');
        else if (responseTime < 300) setQuality('good');
        else if (responseTime < 1000) setQuality('poor');
        else setQuality('offline');
      } catch (error) {
        setQuality('offline');
        setLatency(9999);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return { quality, latency };
}