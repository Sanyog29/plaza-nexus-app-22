-- Fix the INSERT policy for maintenance_requests to include approval status check
DROP POLICY IF EXISTS "Approved users can create requests" ON public.maintenance_requests;

CREATE POLICY "Approved users can create requests" 
ON public.maintenance_requests 
FOR INSERT 
TO authenticated 
WITH CHECK (
  (( SELECT profiles.approval_status
     FROM profiles
     WHERE (profiles.id = auth.uid())) = 'approved'::approval_status) OR 
  is_admin(auth.uid()) OR 
  is_staff(auth.uid())
);