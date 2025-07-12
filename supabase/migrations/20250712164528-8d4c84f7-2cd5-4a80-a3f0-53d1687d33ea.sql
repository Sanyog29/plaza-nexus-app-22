-- Insert vendor offers
INSERT INTO public.vendor_offers (vendor_id, title, description, discount_type, discount_value, minimum_order_amount, offer_code, start_date, end_date, usage_limit, is_active)
SELECT 
  v.id,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 'First Order Discount'
    WHEN v.name = 'South Spice' THEN 'Weekend Special'
  END as title,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 'Get 20% off on your first order'
    WHEN v.name = 'South Spice' THEN 'Flat ₹50 off on weekend orders'
  END as description,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 'percentage'
    WHEN v.name = 'South Spice' THEN 'fixed'
  END as discount_type,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 20.00
    WHEN v.name = 'South Spice' THEN 50.00
  END as discount_value,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 200.00
    WHEN v.name = 'South Spice' THEN 150.00
  END as minimum_order_amount,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 'FIRST20'
    WHEN v.name = 'South Spice' THEN 'WEEKEND50'
  END as offer_code,
  '2024-01-01'::date as start_date,
  '2024-12-31'::date as end_date,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 100
    WHEN v.name = 'South Spice' THEN 200
  END as usage_limit,
  true as is_active
FROM vendors v
WHERE v.name IN ('Tasty Bites', 'South Spice');

-- Fix RLS policies for better user experience
-- Allow pending users to view data
DROP POLICY IF EXISTS "Only approved users can access data" ON public.profiles;
CREATE POLICY "Users can access basic data" ON public.profiles
FOR ALL USING (
  (approval_status = 'approved'::approval_status) OR 
  is_admin(auth.uid()) OR 
  (id = auth.uid())
);

-- Allow system to create alerts
DROP POLICY IF EXISTS "Admins can manage alerts" ON public.alerts;
CREATE POLICY "System can manage alerts" ON public.alerts
FOR ALL USING (true);

-- Enable RLS on vendor notifications and stock alerts
ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Add policies for vendor notifications
CREATE POLICY "Vendor staff can view their notifications" ON public.vendor_notifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM vendor_staff vs 
    WHERE vs.vendor_id = vendor_notifications.vendor_id 
    AND vs.user_id = auth.uid() 
    AND vs.is_active = true
  ) OR is_admin(auth.uid())
);

-- Add policies for stock alerts
CREATE POLICY "Vendor staff can view their stock alerts" ON public.stock_alerts
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM vendor_staff vs 
    WHERE vs.vendor_id = stock_alerts.vendor_id 
    AND vs.user_id = auth.uid() 
    AND vs.is_active = true
  ) OR is_admin(auth.uid())
);