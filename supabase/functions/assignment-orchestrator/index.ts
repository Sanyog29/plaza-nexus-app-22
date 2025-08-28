
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

    const { requestId, action, staffId, photoUrls, closureReason } = await req.json()

    console.log(`Processing action: ${action} for request: ${requestId} by staff: ${staffId}`)

    if (action === 'accept_request') {
      // Accept: UPDATE maintenance_requests SET assigned_to_user_id = :tech_id, accepted_at = NOW(), status = 'accepted' 
      // WHERE id = :request_id AND assigned_to_user_id IS NULL
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({ 
          assigned_to_user_id: staffId,
          accepted_at: new Date().toISOString(),
          status: 'accepted'
        })
        .eq('id', requestId)
        .is('assigned_to_user_id', null)
        .select()

      if (error) throw error

      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ success: false, message: 'Request already assigned or not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Request ${requestId} accepted by ${staffId}`)
      return new Response(
        JSON.stringify({ success: true, message: 'Request accepted successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'start_work') {
      // Start Work: UPDATE SET started_at = NOW(), status = 'in_progress'
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ 
          started_at: new Date().toISOString(),
          status: 'in_progress'
        })
        .eq('id', requestId)
        .eq('assigned_to_user_id', staffId)

      if (error) throw error

      console.log(`Work started on request ${requestId} by ${staffId}`)
      return new Response(
        JSON.stringify({ success: true, message: 'Work started successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'upload_photos') {
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
        .eq('assigned_to_user_id', staffId)

      if (error) throw error

      console.log(`Photos uploaded for request ${requestId}`)
      return new Response(
        JSON.stringify({ success: true, message: 'Photos uploaded successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'close_request') {
      // Close Ticket: UPDATE SET completed_at = NOW(), status = 'closed', closed_by_user_id = :tech_id 
      // WHERE before_photo_url IS NOT NULL AND after_photo_url IS NOT NULL
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({ 
          status: 'closed',
          closed_by_user_id: staffId,
          closure_reason: closureReason || 'Work completed successfully'
        })
        .eq('id', requestId)
        .eq('assigned_to_user_id', staffId)
        .not('before_photo_url', 'is', null)
        .not('after_photo_url', 'is', null)
        .select()

      if (error) throw error

      if (!data || data.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Cannot close request. Both before and after photos are required.' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Request ${requestId} closed by ${staffId}`)
      return new Response(
        JSON.stringify({ success: true, message: 'Request closed successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle other actions...
    return new Response(
      JSON.stringify({ success: false, message: 'Unknown action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
