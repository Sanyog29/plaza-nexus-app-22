-- Fix Critical Security Issue: Tighten maintenance_requests RLS policies
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Assigned staff can view their requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Staff can view all requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Authenticated users can create requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Staff can update all requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Users can update own pending requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Admins and creators can delete requests" ON public.maintenance_requests;

-- Create stricter policies that prevent data leakage
-- Policy 1: Users can ONLY view their own requests
CREATE POLICY "Users view own requests only"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (
  reported_by = auth.uid()
  AND NOT public.is_staff(auth.uid())
);

-- Policy 2: Assigned staff can view ONLY their assigned requests
CREATE POLICY "Staff view assigned requests only"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid()
  AND public.is_staff(auth.uid())
);

-- Policy 3: Admins can view all requests
CREATE POLICY "Admins view all requests"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy 4: Users can create requests for themselves only
CREATE POLICY "Users create own requests"
ON public.maintenance_requests
FOR INSERT
TO authenticated
WITH CHECK (
  reported_by = auth.uid()
);

-- Policy 5: Only assigned staff can update their requests
CREATE POLICY "Assigned staff update requests"
ON public.maintenance_requests
FOR UPDATE
TO authenticated
USING (
  assigned_to = auth.uid()
  AND public.is_staff(auth.uid())
);

-- Policy 6: Admins can update all requests
CREATE POLICY "Admins update all requests"
ON public.maintenance_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()));

-- Policy 7: Users can update only their own pending requests
CREATE POLICY "Users update own pending requests"
ON public.maintenance_requests
FOR UPDATE
TO authenticated
USING (
  reported_by = auth.uid()
  AND status = 'pending'
  AND NOT public.is_staff(auth.uid())
);

-- Policy 8: Only admins can delete
CREATE POLICY "Only admins delete requests"
ON public.maintenance_requests
FOR DELETE
TO authenticated
USING (public.is_admin(auth.uid()));