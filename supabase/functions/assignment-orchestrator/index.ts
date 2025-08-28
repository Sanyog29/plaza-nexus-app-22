
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

    const { requestId, action, staffId } = await req.json()

    if (action === 'complete_request') {
      // Award points for completion
      await awardCompletionPoints(supabase, requestId, staffId)
      
      // Update request status
      await supabase
        .from('maintenance_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      return new Response(
        JSON.stringify({ success: true, message: 'Request completed and points awarded' }),
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

async function awardCompletionPoints(supabase: any, requestId: string, staffId: string) {
  // Get request details for points calculation
  const { data: request } = await supabase
    .from('maintenance_requests')
    .select('priority, category_id')
    .eq('id', requestId)
    .single()

  // Calculate points based on priority
  const basePoints = {
    'critical': 50,
    'high': 30,
    'medium': 20,
    'low': 10
  }

  const pointsToAward = basePoints[request?.priority as keyof typeof basePoints] || 10

  // First, try to get existing points record
  const { data: existingPoints } = await supabase
    .from('technician_points')
    .select('*')
    .eq('technician_id', staffId)
    .maybeSingle()

  if (existingPoints) {
    // Update existing record
    await supabase
      .from('technician_points')
      .update({
        points_earned: existingPoints.points_earned + pointsToAward,
        points_balance: existingPoints.points_balance + pointsToAward,
        total_lifetime_points: existingPoints.total_lifetime_points + pointsToAward
      })
      .eq('technician_id', staffId)
  } else {
    // Create new record
    await supabase
      .from('technician_points')
      .insert({
        technician_id: staffId,
        points_earned: pointsToAward,
        points_balance: pointsToAward,
        total_lifetime_points: pointsToAward,
        current_tier: 'bronze'
      })
  }

  // Log the transaction
  await supabase
    .from('point_transactions')
    .insert({
      technician_id: staffId,
      points: pointsToAward,
      transaction_type: 'earned',
      reason: `Completed maintenance request #${requestId.slice(0, 8)}`,
      metadata: { request_id: requestId, priority: request?.priority }
    })
}
