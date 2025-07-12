-- Link existing vendor users to vendor businesses
-- Get the first available vendor for each vendor user
WITH vendor_assignments AS (
  SELECT 
    p.id as user_id,
    v.id as vendor_id,
    ROW_NUMBER() OVER (ORDER BY v.created_at) as vendor_rank,
    ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY v.created_at) as user_vendor_rank
  FROM public.profiles p
  CROSS JOIN public.vendors v
  WHERE p.role = 'vendor'
    AND NOT EXISTS (
      SELECT 1 FROM public.vendor_staff vs 
      WHERE vs.user_id = p.id
    )
)
INSERT INTO public.vendor_staff (vendor_id, user_id, role, permissions, is_active)
SELECT 
  vendor_id,
  user_id,
  'manager'::text,
  '{"manage_menu": true, "manage_orders": true, "view_analytics": true, "manage_staff": true}'::jsonb,
  true
FROM vendor_assignments
WHERE user_vendor_rank = 1
  AND vendor_rank <= 2; -- Assign first two vendors to the vendor users

-- Update vendor_staff RLS policies to allow proper access
DROP POLICY IF EXISTS "Vendor staff can view their own record" ON public.vendor_staff;
DROP POLICY IF EXISTS "Vendor staff can update their own record" ON public.vendor_staff;

-- Enable RLS on vendor_staff table
ALTER TABLE public.vendor_staff ENABLE ROW LEVEL SECURITY;

-- Create comprehensive RLS policies for vendor_staff
CREATE POLICY "Vendor staff can view their own record" 
ON public.vendor_staff 
FOR SELECT 
USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Vendor managers can view their vendor staff" 
ON public.vendor_staff 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_staff vs 
    WHERE vs.vendor_id = vendor_staff.vendor_id 
      AND vs.user_id = auth.uid() 
      AND vs.is_active = true
      AND vs.role = 'manager'
  ) OR is_admin(auth.uid())
);

CREATE POLICY "Vendor staff can update their own record" 
ON public.vendor_staff 
FOR UPDATE 
USING (user_id = auth.uid());