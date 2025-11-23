-- Allow procurement staff to view properties referenced in requisitions they can access
CREATE POLICY "Procurement can view properties from requisitions"
ON public.properties
FOR SELECT
TO authenticated
USING (
  is_procurement_staff(auth.uid()) 
  AND EXISTS (
    SELECT 1 
    FROM public.requisition_lists 
    WHERE requisition_lists.property_id = properties.id
  )
);