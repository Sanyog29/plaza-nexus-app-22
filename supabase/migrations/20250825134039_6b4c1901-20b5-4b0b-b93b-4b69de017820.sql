-- Safe database reset - clear maintenance data for fresh start
-- Delete dependent records first (order matters for foreign keys)
DELETE FROM request_status_history;
DELETE FROM request_time_extensions;
DELETE FROM request_offers;
DELETE FROM request_workflow_states;
DELETE FROM request_workflow_transitions;

-- Reset all maintenance requests to pending status
UPDATE maintenance_requests
SET
  assigned_to = null,
  assigned_at = null,
  assignment_acknowledged_at = null,
  en_route_at = null,
  work_started_at = null,
  completed_at = null,
  estimated_arrival = null,
  escalation_level = null,
  escalated_at = null,
  technician_location = null,
  status = 'pending',
  workflow_step = 1,
  updated_at = now();

-- Add RLS policy to allow staff to assign when unassigned
CREATE POLICY "staff_can_assign_when_unassigned"
ON public.maintenance_requests
FOR UPDATE
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()) AND (assigned_to IS NULL OR assigned_to = auth.uid()));