-- Fix maintenance_requests security vulnerability
-- Remove public read access and implement proper access controls

-- Ensure RLS is enabled
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Public can view maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Users can view all requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Authenticated users can view all requests" ON public.maintenance_requests;

-- Create secure, granular RLS policies

-- 1. Users can view ONLY their own maintenance requests
CREATE POLICY "Users can view their own maintenance requests"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (reported_by = auth.uid());

-- 2. Users can create their own maintenance requests
CREATE POLICY "Users can create their own maintenance requests"
ON public.maintenance_requests
FOR INSERT
TO authenticated
WITH CHECK (reported_by = auth.uid());

-- 3. Users can update their own pending/in_progress requests
CREATE POLICY "Users can update their own requests"
ON public.maintenance_requests
FOR UPDATE
TO authenticated
USING (
  reported_by = auth.uid() 
  AND status IN ('pending', 'assigned', 'in_progress')
)
WITH CHECK (
  reported_by = auth.uid()
);

-- 4. Users can delete their own pending requests
CREATE POLICY "Users can delete their own pending requests"
ON public.maintenance_requests
FOR DELETE
TO authenticated
USING (
  reported_by = auth.uid() 
  AND status = 'pending'
);

-- 5. Staff can view all maintenance requests (for operations)
CREATE POLICY "Staff can view all maintenance requests"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

-- 6. Staff can manage all maintenance requests
CREATE POLICY "Staff can manage all maintenance requests"
ON public.maintenance_requests
FOR ALL
TO authenticated
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Add security comment
COMMENT ON TABLE public.maintenance_requests IS 
'SECURITY NOTE: This table contains sensitive maintenance data including locations, GPS coordinates, photos, and personal descriptions. 
Access is restricted by RLS:
- Users can only see their own requests
- Staff members can view and manage all requests for operational purposes
- Admins have full access
This prevents unauthorized access to sensitive location and personal data.';

-- Log the security fix
DO $$
BEGIN
  RAISE NOTICE 'Security fix applied: maintenance_requests table now has proper RLS policies';
END $$;