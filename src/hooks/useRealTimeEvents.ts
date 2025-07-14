import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeEvent {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  event_data: any;
  severity: string;
  user_id: string | null;
  created_at: string;
}

interface EventSubscription {
  eventTypes: string[];
  callback: (event: RealTimeEvent) => void;
}

export const useRealTimeEvents = () => {
  const [events, setEvents] = useState<RealTimeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState<EventSubscription[]>([]);

  const addEvent = useCallback(async (event: Omit<RealTimeEvent, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('real_time_events')
        .insert([event])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding real-time event:', error);
      throw error;
    }
  }, []);

  const fetchRecentEvents = useCallback(async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('real_time_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching recent events:', error);
    }
  }, []);

  const subscribeToEvents = useCallback((eventTypes: string[], callback: (event: RealTimeEvent) => void) => {
    const subscription: EventSubscription = { eventTypes, callback };
    setSubscriptions(prev => [...prev, subscription]);
    
    return () => {
      setSubscriptions(prev => prev.filter(s => s !== subscription));
    };
  }, []);

  const emitRequestEvent = useCallback(async (
    eventType: 'request_created' | 'request_updated' | 'request_assigned' | 'request_completed',
    requestId: string,
    additionalData?: any
  ) => {
    await addEvent({
      event_type: eventType,
      entity_type: 'request',
      entity_id: requestId,
      event_data: {
        ...additionalData,
        timestamp: new Date().toISOString()
      },
      severity: eventType === 'request_created' ? 'info' : 'info',
      user_id: (await supabase.auth.getUser()).data.user?.id || null
    });
  }, [addEvent]);

  const emitSystemAlert = useCallback(async (
    alertType: 'sla_breach' | 'system_overload' | 'maintenance_due' | 'critical_error',
    message: string,
    entityId?: string,
    additionalData?: any
  ) => {
    await addEvent({
      event_type: 'system_alert',
      entity_type: entityId ? 'system' : 'global',
      entity_id: entityId || null,
      event_data: {
        alert_type: alertType,
        message,
        ...additionalData,
        timestamp: new Date().toISOString()
      },
      severity: alertType === 'critical_error' || alertType === 'sla_breach' ? 'critical' : 'warning',
      user_id: null
    });
  }, [addEvent]);

  const emitUserActivity = useCallback(async (
    activity: 'login' | 'logout' | 'task_completion' | 'status_change',
    userId: string,
    additionalData?: any
  ) => {
    await addEvent({
      event_type: 'user_activity',
      entity_type: 'user',
      entity_id: userId,
      event_data: {
        activity,
        ...additionalData,
        timestamp: new Date().toISOString()
      },
      severity: 'info',
      user_id: userId
    });
  }, [addEvent]);

  const emitAssetEvent = useCallback(async (
    eventType: 'maintenance_scheduled' | 'maintenance_completed' | 'alert_triggered' | 'status_changed',
    assetId: string,
    additionalData?: any
  ) => {
    await addEvent({
      event_type: eventType,
      entity_type: 'asset',
      entity_id: assetId,
      event_data: {
        ...additionalData,
        timestamp: new Date().toISOString()
      },
      severity: eventType === 'alert_triggered' ? 'warning' : 'info',
      user_id: (await supabase.auth.getUser()).data.user?.id || null
    });
  }, [addEvent]);

  // Real-time subscription setup
  useEffect(() => {
    const channel = supabase
      .channel('real-time-events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'real_time_events'
      }, (payload) => {
        const newEvent = payload.new as RealTimeEvent;
        
        // Add to local state
        setEvents(prev => [newEvent, ...prev.slice(0, 99)]);
        
        // Notify subscribers
        subscriptions.forEach(subscription => {
          if (subscription.eventTypes.includes(newEvent.event_type) || 
              subscription.eventTypes.includes('*')) {
            subscription.callback(newEvent);
          }
        });
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subscriptions]);

  // Load initial events
  useEffect(() => {
    fetchRecentEvents();
  }, [fetchRecentEvents]);

  return {
    events,
    isConnected,
    addEvent,
    fetchRecentEvents,
    subscribeToEvents,
    emitRequestEvent,
    emitSystemAlert,
    emitUserActivity,
    emitAssetEvent
  };
};