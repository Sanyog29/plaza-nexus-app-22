-- Create helper function to check if user has procurement role
CREATE OR REPLACE FUNCTION public.is_procurement_staff(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = $1
      AND role IN ('procurement_manager', 'purchase_executive')
  );
$$;

-- Create RLS policy to allow procurement staff to view approved and later requisitions
CREATE POLICY "Procurement staff can view approved & later requisitions"
ON public.requisition_lists
FOR SELECT
TO authenticated
USING (
  public.is_procurement_staff(auth.uid()) 
  AND status IN (
    'manager_approved',
    'assigned_to_procurement',
    'po_raised',
    'in_transit',
    'received',
    'closed'
  )
);

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.is_procurement_staff(uuid) TO authenticated;