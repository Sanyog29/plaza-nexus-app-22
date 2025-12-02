-- Fix tickets that have assignees but status is still 'pending'
-- This ensures the assignee can see the "Start Work" button
UPDATE maintenance_requests 
SET status = 'assigned', 
    updated_at = NOW()
WHERE assigned_to IS NOT NULL 
  AND status = 'pending';

-- Add a comment for audit purposes
COMMENT ON TABLE maintenance_requests IS 'Fixed pending tickets with assignees to assigned status on 2025-12-02';