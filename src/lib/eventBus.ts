/**
 * Event Bus Client
 * 
 * Client-side wrapper for publishing and subscribing to domain events
 * Uses Supabase Realtime for live updates
 */

import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface DomainEvent {
  event_id?: string;
  event_type: string;
  domain: string;
  aggregate_id: string;
  payload: Record<string, any>;
  metadata: {
    user_id?: string;
    correlation_id?: string;
    causation_id?: string;
    timestamp?: string;
  };
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

/**
 * Event Bus for publishing and subscribing to domain events
 */
export class EventBus {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Publish a domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('event-bus', {
        body: {
          action: 'publish',
          event: {
            ...event,
            metadata: {
              ...event.metadata,
              user_id: event.metadata.user_id || (await supabase.auth.getUser()).data.user?.id,
              timestamp: new Date().toISOString()
            }
          }
        }
      });

      if (error) throw error;

      console.log('[EventBus] Published event:', event.event_type, data);
    } catch (error) {
      console.error('[EventBus] Publish failed:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events from a specific domain
   */
  subscribe(domain: string, handler: EventHandler): () => void {
    const channelName = `domain-events:${domain}`;
    
    // Reuse existing channel if available
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'domain_events',
            filter: `domain=eq.${domain}`
          },
          (payload) => {
            const event = payload.new as DomainEvent;
            console.log('[EventBus] Received event:', event.event_type);
            handler(event);
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);
    }

    // Return unsubscribe function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Subscribe to specific event types
   */
  subscribeToEvent(eventType: string, handler: EventHandler): () => void {
    const channelName = `event-type:${eventType}`;
    
    let channel = this.channels.get(channelName);
    
    if (!channel) {
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'domain_events',
            filter: `event_type=eq.${eventType}`
          },
          (payload) => {
            const event = payload.new as DomainEvent;
            handler(event);
          }
        )
        .subscribe();

      this.channels.set(channelName, channel);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
        this.channels.delete(channelName);
      }
    };
  }

  /**
   * Clean up all subscriptions
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

// Singleton instance
export const eventBus = new EventBus();

/**
 * Standard event types for the system
 */
export const EventTypes = {
  // Cafeteria domain
  CAFETERIA: {
    ORDER_CREATED: 'cafeteria.order.created',
    ORDER_CONFIRMED: 'cafeteria.order.confirmed',
    ORDER_COMPLETED: 'cafeteria.order.completed',
    ORDER_CANCELLED: 'cafeteria.order.cancelled',
    PAYMENT_PROCESSED: 'cafeteria.payment.processed',
    PAYMENT_FAILED: 'cafeteria.payment.failed',
  },
  
  // Maintenance domain
  MAINTENANCE: {
    REQUEST_CREATED: 'maintenance.request.created',
    REQUEST_ASSIGNED: 'maintenance.request.assigned',
    REQUEST_STARTED: 'maintenance.request.started',
    REQUEST_COMPLETED: 'maintenance.request.completed',
    ESCALATION_TRIGGERED: 'maintenance.escalation.triggered',
  },
  
  // Visitor domain
  VISITOR: {
    CHECKED_IN: 'visitor.checkin',
    CHECKED_OUT: 'visitor.checkout',
    BADGE_ISSUED: 'visitor.badge.issued',
    ALERT_RAISED: 'visitor.alert.raised',
  },
  
  // Notification domain
  NOTIFICATION: {
    EMAIL_SENT: 'notification.email.sent',
    SMS_SENT: 'notification.sms.sent',
    PUSH_SENT: 'notification.push.sent',
    ALERT_CREATED: 'notification.alert.created',
  }
};
