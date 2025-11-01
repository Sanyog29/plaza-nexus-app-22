/**
 * Event Bus - Event-Driven Architecture Foundation
 * 
 * Publishes and subscribes to domain events for loose coupling
 * Uses Supabase Realtime as message broker
 * 
 * Supports patterns:
 * - Event-Driven Communication
 * - Saga Pattern (choreography-based)
 * - CQRS (event sourcing for read models)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DomainEvent {
  event_id?: string;
  event_type: string;
  domain: string;
  aggregate_id: string;
  payload: Record<string, any>;
  metadata: {
    user_id?: string;
    correlation_id?: string;
    causation_id?: string;
    timestamp: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { action, event } = await req.json() as { 
      action: 'publish' | 'subscribe', 
      event?: DomainEvent 
    };

    if (action === 'publish') {
      if (!event) {
        return new Response(
          JSON.stringify({ error: 'Event payload required for publish' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate event ID
      const eventId = crypto.randomUUID();
      const enrichedEvent = {
        ...event,
        event_id: eventId,
        metadata: {
          ...event.metadata,
          timestamp: new Date().toISOString()
        }
      };

      // Store event in event store
      const { error: storeError } = await supabase
        .from('domain_events')
        .insert(enrichedEvent);

      if (storeError) {
        console.error('[EventBus] Store error:', storeError);
        throw storeError;
      }

      console.log(`[EventBus] Published: ${event.event_type} (${eventId})`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          event_id: eventId,
          event_type: event.event_type 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Subscribe action returns instructions for client-side Realtime subscription
    if (action === 'subscribe') {
      return new Response(
        JSON.stringify({
          message: 'Use Supabase Realtime client to subscribe to domain_events table',
          example: {
            table: 'domain_events',
            event: '*',
            filter: 'domain=eq.cafeteria'
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use publish or subscribe' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[EventBus] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Event bus error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
