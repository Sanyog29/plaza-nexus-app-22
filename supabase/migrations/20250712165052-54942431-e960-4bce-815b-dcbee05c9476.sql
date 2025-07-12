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