/**
 * API Gateway - Strangler Fig Pattern Implementation
 * 
 * This gateway routes all incoming requests to either:
 * - Legacy monolith endpoints (current system)
 * - New microservices (as they're extracted)
 * 
 * Phase 1: All traffic passes through but routes to monolith
 * Phase 2+: Gradually route specific paths to microservices
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RouteConfig {
  pattern: RegExp;
  service: 'monolith' | 'cafeteria' | 'analytics' | 'notifications' | 'workflow';
  endpoint?: string;
}

// Route configuration - expand as services are extracted
const routes: RouteConfig[] = [
  // Phase 2: Cafeteria microservice routes (future)
  // { pattern: /^\/cafeteria\//, service: 'cafeteria', endpoint: 'https://cafeteria-service-url' },
  
  // Phase 1: All routes to monolith
  { pattern: /.*/, service: 'monolith' }
];

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    
    console.log(`[Gateway] ${requestId} - ${req.method} ${path}`);
    
    // Find matching route
    const route = routes.find(r => r.pattern.test(path));
    
    if (!route) {
      return new Response(
        JSON.stringify({ error: 'No route configured for path' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Log routing decision
    console.log(`[Gateway] ${requestId} - Routing to ${route.service}`);
    
    // Emit routing event for observability
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    await supabase.from('gateway_logs').insert({
      request_id: requestId,
      method: req.method,
      path,
      service: route.service,
      latency_ms: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });
    
    // Phase 1: Return success (actual routing in Phase 2)
    return new Response(
      JSON.stringify({
        message: 'Gateway operational',
        request_id: requestId,
        routed_to: route.service,
        phase: 'Phase 1 - Observability Only'
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Request-ID': requestId 
        } 
      }
    );
    
  } catch (error) {
    console.error(`[Gateway] ${requestId} - Error:`, error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Gateway error', 
        request_id: requestId,
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
