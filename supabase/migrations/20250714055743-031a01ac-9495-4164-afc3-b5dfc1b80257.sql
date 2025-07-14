-- Fix infinite recursion in vendor_staff RLS policies
-- First, create a security definer function to check vendor staff status
CREATE OR REPLACE FUNCTION public.is_vendor_staff_for_vendor(user_id uuid, target_vendor_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_staff
    WHERE vendor_staff.user_id = $1 
    AND vendor_staff.vendor_id = $2 
    AND vendor_staff.is_active = true
  );
$$;

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Vendor managers can view their vendor staff" ON public.vendor_staff;
DROP POLICY IF EXISTS "Vendor staff can view their notifications" ON public.vendor_notifications;
DROP POLICY IF EXISTS "Vendor staff can view their stock alerts" ON public.stock_alerts;
DROP POLICY IF EXISTS "Vendors can view feedback for their orders" ON public.order_feedback;

-- Create new non-recursive policies using the security definer function
CREATE POLICY "Vendor staff can view their own vendor staff records"
ON public.vendor_staff
FOR SELECT
USING (
  user_id = auth.uid() OR 
  is_admin(auth.uid()) OR
  public.is_vendor_staff_for_vendor(auth.uid(), vendor_id)
);

CREATE POLICY "Vendor staff can view notifications for their vendor"
ON public.vendor_notifications
FOR SELECT
USING (
  public.is_vendor_staff_for_vendor(auth.uid(), vendor_id) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Vendor staff can view stock alerts for their vendor"
ON public.stock_alerts
FOR SELECT
USING (
  public.is_vendor_staff_for_vendor(auth.uid(), vendor_id) OR 
  is_admin(auth.uid())
);

CREATE POLICY "Vendor staff can view feedback for their vendor orders"
ON public.order_feedback
FOR SELECT
USING (
  auth.uid() = user_id OR
  public.is_vendor_staff_for_vendor(auth.uid(), vendor_id) OR
  is_admin(auth.uid())
);