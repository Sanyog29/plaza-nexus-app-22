
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { requestId, action, staffId, photoUrls, closureReason } = body

    console.log('[assignment-orchestrator] Request received:', {
      action: action || 'MISSING',
      requestId: requestId || 'MISSING',
      staffId: staffId || 'MISSING',
      hasPhotoUrls: !!photoUrls,
      hasClosureReason: !!closureReason,
      timestamp: new Date().toISOString()
    })

    // Validate required parameters
    if (!action) {
      console.error('[assignment-orchestrator] Missing action parameter')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameter: action',
          validActions: ['accept_request', 'start_work', 'upload_photos', 'close_request']
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!requestId) {
      console.error('[assignment-orchestrator] Missing requestId parameter')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameter: requestId'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (action === 'accept_request') {
      if (!staffId) {
        console.error('[assignment-orchestrator] Missing staffId for accept_request')
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required parameter: staffId for accept_request action'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      console.log('[assignment-orchestrator] Accepting request:', { requestId, staffId })
      
      // Accept: UPDATE maintenance_requests SET assigned_to = :tech_id, assigned_at = NOW(), status = 'accepted' 
      // WHERE id = :request_id AND assigned_to IS NULL
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({ 
          assigned_to: staffId,
          assigned_at: new Date().toISOString(),
          status: 'accepted'
        })
        .eq('id', requestId)
        .is('assigned_to', null)
        .select()

      if (error) {
        console.error('[assignment-orchestrator] Error accepting request:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.warn('[assignment-orchestrator] Request already assigned or not found')
        return new Response(
          JSON.stringify({ success: false, message: 'Request already assigned or not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[assignment-orchestrator] Request accepted successfully:', data[0])
      return new Response(
        JSON.stringify({ success: true, message: 'Request accepted successfully', data: data[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'start_work') {
      if (!staffId) {
        console.error('[assignment-orchestrator] Missing staffId for start_work')
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required parameter: staffId for start_work action'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      console.log('[assignment-orchestrator] Starting work:', { requestId, staffId })
      
      // Start Work: UPDATE SET work_started_at = NOW(), status = 'in_progress'
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          work_started_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', requestId)
        .eq('assigned_to', staffId)

      if (error) {
        console.error('[assignment-orchestrator] Error starting work:', error)
        throw error
      }

      console.log('[assignment-orchestrator] Work started successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Work started successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'upload_photos') {
      if (!photoUrls || typeof photoUrls !== 'object') {
        console.error('[assignment-orchestrator] Missing or invalid photoUrls')
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing or invalid parameter: photoUrls (expected object with before_photo_url/after_photo_url)'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      console.log('[assignment-orchestrator] Uploading photos:', {
        requestId,
        hasBeforePhoto: !!photoUrls.before_photo_url,
        hasAfterPhoto: !!photoUrls.after_photo_url
      })
      
      // Upload Photos: UPDATE SET before_photo_url = :before_url, after_photo_url = :after_url
      const updateData: any = {}
      if (photoUrls?.before_photo_url) {
        updateData.before_photo_url = photoUrls.before_photo_url
      }
      if (photoUrls?.after_photo_url) {
        updateData.after_photo_url = photoUrls.after_photo_url
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .update(updateData)
        .eq('id', requestId)
        .eq('assigned_to', staffId)

      if (error) {
        console.error('[assignment-orchestrator] Error uploading photos:', error)
        throw error
      }

      console.log('[assignment-orchestrator] Photos uploaded successfully')
      return new Response(
        JSON.stringify({ success: true, message: 'Photos uploaded successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'close_request') {
      console.log('[assignment-orchestrator] Attempting to close request:', {
        requestId,
        staffId,
        hasClosureReason: !!closureReason
      })
      
      // Close Ticket: UPDATE SET completed_at = NOW(), status = 'completed'
      // WHERE before_photo_url IS NOT NULL AND after_photo_url IS NOT NULL
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          closure_reason: closureReason || 'Work completed successfully'
        })
        .eq('id', requestId)
        .eq('assigned_to', staffId)
        .not('before_photo_url', 'is', null)
        .not('after_photo_url', 'is', null)
        .select()

      if (error) {
        console.error('[assignment-orchestrator] Error closing request:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.warn('[assignment-orchestrator] Cannot close - missing photos or unauthorized')
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Cannot close request. Both before and after photos are required.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('[assignment-orchestrator] Request closed successfully:', data[0])
      return new Response(
        JSON.stringify({ success: true, message: 'Request closed successfully', data: data[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle other actions...
    console.error('[assignment-orchestrator] Unknown action:', action)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Unknown action',
        receivedAction: action,
        validActions: ['accept_request', 'start_work', 'upload_photos', 'close_request']
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('[assignment-orchestrator] Error processing request:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error',
        type: error.name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
