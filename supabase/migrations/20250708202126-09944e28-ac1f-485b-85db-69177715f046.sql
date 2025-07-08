-- Add RLS policies for controlled deletion of maintenance requests
-- Only allow deletion of pending requests by the reporter or staff

-- Policy for users to delete their own pending requests
CREATE POLICY "Users can delete their own pending requests" 
ON maintenance_requests 
FOR DELETE 
USING (
  auth.uid() = reported_by 
  AND status = 'pending'
);

-- Policy for staff to delete any pending requests
CREATE POLICY "Staff can delete pending requests" 
ON maintenance_requests 
FOR DELETE 
USING (
  is_staff(auth.uid()) 
  AND status = 'pending'
);