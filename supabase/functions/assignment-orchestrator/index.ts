import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Assignment orchestrator running...');

    // 1. Handle auto-offline users
    await handleAutoOfflineUsers(supabaseClient);

    // 2. Process unacknowledged assignments
    await processUnacknowledgedAssignments(supabaseClient);

    // 3. Process SLA breaches and escalations
    await processSLABreaches(supabaseClient);

    // 4. Handle crisis tickets
    await handleCrisisTickets(supabaseClient);

    return new Response(
      JSON.stringify({ success: true, message: 'Assignment orchestration completed' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in assignment orchestrator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleAutoOfflineUsers(supabase: any) {
  console.log('Checking auto-offline users...');
  
  const { data: users, error } = await supabase
    .from('staff_availability')
    .select('staff_id')
    .not('auto_offline_at', 'is', null)
    .lt('auto_offline_at', new Date().toISOString());

  if (error) {
    console.error('Error fetching auto-offline users:', error);
    return;
  }

  for (const user of users || []) {
    await supabase
      .from('staff_availability')
      .update({
        availability_status: 'offline',
        is_available: false,
        auto_offline_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('staff_id', user.staff_id);
    
    console.log(`Set user ${user.staff_id} to offline automatically`);
  }
}

async function processUnacknowledgedAssignments(supabase: any) {
  console.log('Processing unacknowledged assignments...');
  
  // Find tickets assigned but not acknowledged within 10 minutes
  const { data: tickets, error } = await supabase
    .from('maintenance_requests')
    .select(`
      id, assigned_to, assigned_group, escalation_level, auto_assignment_attempts,
      priority, next_escalation_at, is_crisis
    `)
    .not('assigned_to', 'is', null)
    .is('assignment_acknowledged_at', null)
    .not('next_escalation_at', 'is', null)
    .lt('next_escalation_at', new Date().toISOString())
    .in('status', ['pending', 'in_progress']);

  if (error) {
    console.error('Error fetching unacknowledged tickets:', error);
    return;
  }

  for (const ticket of tickets || []) {
    console.log(`Processing unacknowledged ticket ${ticket.id}`);
    
    // Try to reassign to another available L1 staff in the same group
    const { data: availableStaff } = await supabase
      .from('profiles')
      .select(`
        id, first_name, last_name,
        staff_group_assignments!inner(staff_level),
        staff_availability!inner(is_available, availability_status)
      `)
      .eq('staff_group_assignments.group_id', ticket.assigned_group)
      .eq('staff_group_assignments.staff_level', 1)
      .eq('staff_availability.is_available', true)
      .eq('staff_availability.availability_status', 'available')
      .neq('id', ticket.assigned_to)
      .limit(1);

    if (availableStaff && availableStaff.length > 0) {
      // Reassign to available staff
      await reassignTicket(supabase, ticket.id, availableStaff[0].id, 'reassignment', 'Previous assignee did not acknowledge');
      console.log(`Reassigned ticket ${ticket.id} to ${availableStaff[0].id}`);
    } else {
      // No L1 available, escalate to L2
      await escalateTicket(supabase, ticket.id, 2, 'No L1 staff available for reassignment');
      console.log(`Escalated ticket ${ticket.id} to L2`);
    }
  }
}

async function processSLABreaches(supabase: any) {
  console.log('Processing SLA breaches...');
  
  // Find tickets that have breached SLA
  const { data: tickets, error } = await supabase
    .from('maintenance_requests')
    .select(`
      id, priority, escalation_level, sla_breach_at, assigned_group,
      next_escalation_at, is_crisis
    `)
    .not('sla_breach_at', 'is', null)
    .lt('sla_breach_at', new Date().toISOString())
    .in('status', ['pending', 'in_progress'])
    .not('assignment_acknowledged_at', 'is', null); // Only process acknowledged tickets

  if (error) {
    console.error('Error fetching SLA breached tickets:', error);
    return;
  }

  for (const ticket of tickets || []) {
    console.log(`Processing SLA breached ticket ${ticket.id}`);
    
    if (ticket.escalation_level < 5) {
      const nextLevel = ticket.escalation_level + 1;
      await escalateTicket(supabase, ticket.id, nextLevel, `SLA breach - escalating to L${nextLevel}`);
      
      // Create escalation log
      await supabase
        .from('escalation_logs')
        .insert({
          request_id: ticket.id,
          escalation_type: 'sla_breach',
          escalation_reason: `SLA breach - escalated to L${nextLevel}`,
          metadata: {
            previous_level: ticket.escalation_level,
            new_level: nextLevel,
            breach_time: new Date().toISOString()
          }
        });
    }
  }
}

async function handleCrisisTickets(supabase: any) {
  console.log('Handling crisis tickets...');
  
  // Find unassigned crisis tickets
  const { data: crisisTickets, error } = await supabase
    .from('maintenance_requests')
    .select('id, assigned_group')
    .eq('is_crisis', true)
    .is('assigned_to', null)
    .in('status', ['pending']);

  if (error) {
    console.error('Error fetching crisis tickets:', error);
    return;
  }

  for (const ticket of crisisTickets || []) {
    console.log(`Processing crisis ticket ${ticket.id}`);
    
    // Find highest level available staff (L5 first, then L4, etc.)
    for (let level = 5; level >= 1; level--) {
      const { data: availableStaff } = await supabase
        .from('profiles')
        .select(`
          id, first_name, last_name,
          staff_group_assignments!inner(staff_level),
          staff_availability!inner(is_available, availability_status)
        `)
        .eq('staff_group_assignments.group_id', ticket.assigned_group)
        .eq('staff_group_assignments.staff_level', Math.min(level, 2)) // Only L1 and L2 in assignments
        .eq('staff_availability.is_available', true)
        .eq('staff_availability.availability_status', 'available')
        .limit(1);

      if (availableStaff && availableStaff.length > 0) {
        await reassignTicket(supabase, ticket.id, availableStaff[0].id, 'auto', 'Crisis ticket auto-assignment');
        
        // Set escalation level to 5 for crisis
        await supabase
          .from('maintenance_requests')
          .update({
            escalation_level: 5,
            next_escalation_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
          })
          .eq('id', ticket.id);
        
        console.log(`Assigned crisis ticket ${ticket.id} to ${availableStaff[0].id}`);
        break;
      }
    }
  }
}

async function reassignTicket(supabase: any, ticketId: string, newAssigneeId: string, assignmentType: string, reason: string) {
  // Update the ticket assignment
  await supabase
    .from('maintenance_requests')
    .update({
      assigned_to: newAssigneeId,
      assignment_acknowledged_at: null, // Reset acknowledgment
      next_escalation_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes to acknowledge
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId);

  // Log the assignment
  await supabase
    .from('ticket_assignment_history')
    .insert({
      request_id: ticketId,
      assigned_to: newAssigneeId,
      assignment_type: assignmentType,
      assignment_reason: reason
    });

  // Create notification for new assignee
  await supabase
    .from('notifications')
    .insert({
      user_id: newAssigneeId,
      title: 'New Ticket Assignment',
      message: `You have been assigned a maintenance ticket. Please acknowledge within 10 minutes.`,
      type: 'assignment',
      action_url: `/requests/${ticketId}`,
      metadata: { ticket_id: ticketId, assignment_type: assignmentType }
    });
}

async function escalateTicket(supabase: any, ticketId: string, newLevel: number, reason: string) {
  // Calculate new escalation time based on level
  const escalationTimes = {
    1: 10, // 10 minutes
    2: 10, // 10 minutes  
    3: 15, // 15 minutes
    4: 30, // 30 minutes
    5: 60  // 1 hour
  };

  const nextEscalationMinutes = escalationTimes[newLevel as keyof typeof escalationTimes] || 30;
  
  await supabase
    .from('maintenance_requests')
    .update({
      escalation_level: newLevel,
      next_escalation_at: new Date(Date.now() + nextEscalationMinutes * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId);

  // Find appropriate staff for this escalation level
  const levelMapping = {
    1: ['field_staff'],
    2: ['ops_supervisor'], 
    3: ['admin'],
    4: ['admin'], 
    5: ['admin']
  };

  const targetRoles = levelMapping[newLevel as keyof typeof levelMapping] || ['admin'];

  // Notify all users at the target level
  const { data: targetUsers } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('role', targetRoles);

  for (const user of targetUsers || []) {
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        title: `Ticket Escalated to L${newLevel}`,
        message: `Ticket has been escalated to Level ${newLevel}. Reason: ${reason}`,
        type: 'escalation',
        action_url: `/requests/${ticketId}`,
        metadata: { 
          ticket_id: ticketId, 
          escalation_level: newLevel,
          escalation_reason: reason
        }
      });
  }
}