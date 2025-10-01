-- Critical Security Fix: Core tables only
-- Applying RLS policies to verified existing tables

-- 1. Fix maintenance_requests
DROP POLICY IF EXISTS "Users can view their own requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Staff can manage all requests" ON maintenance_requests;

CREATE POLICY "Users can view their own requests"
ON maintenance_requests FOR SELECT
TO authenticated
USING (reported_by = auth.uid() OR assigned_to = auth.uid() OR is_staff(auth.uid()));

CREATE POLICY "Staff can manage all requests"
ON maintenance_requests FOR ALL
TO authenticated
USING (is_staff(auth.uid()));

-- 2. Fix cafeteria_menu_items
DROP POLICY IF EXISTS "Authenticated users can view available menu items" ON cafeteria_menu_items;
DROP POLICY IF EXISTS "Anyone can view available menu items" ON cafeteria_menu_items;
DROP POLICY IF EXISTS "Vendor staff can manage their menu items" ON cafeteria_menu_items;

CREATE POLICY "Anyone can view available menu items"
ON cafeteria_menu_items FOR SELECT
TO authenticated
USING (is_available = true);

CREATE POLICY "Vendor staff can manage their menu items"
ON cafeteria_menu_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendor_staff vs
    JOIN cafeteria_menu_categories cmc ON cmc.id = cafeteria_menu_items.category_id
    WHERE vs.vendor_id = cmc.vendor_id
    AND vs.user_id = auth.uid()
    AND vs.is_active = true
  )
);

-- 3. Fix assets table
DROP POLICY IF EXISTS "Staff can manage all assets" ON assets;
DROP POLICY IF EXISTS "Staff can update all assets" ON assets;
DROP POLICY IF EXISTS "Staff can delete all assets" ON assets;

CREATE POLICY "Staff can manage all assets"
ON assets FOR INSERT
TO authenticated
WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update all assets"
ON assets FOR UPDATE
TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can delete all assets"
ON assets FOR DELETE
TO authenticated
USING (is_staff(auth.uid()));

-- 4. Fix system_settings - CRITICAL
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage system settings" ON system_settings;
DROP POLICY IF EXISTS "Staff can view system settings" ON system_settings;

CREATE POLICY "Admins can manage system settings"
ON system_settings FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view system settings"
ON system_settings FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

-- 5. Fix vendors table
DROP POLICY IF EXISTS "Anyone can view active vendors" ON vendors;
DROP POLICY IF EXISTS "Authenticated users can view approved vendors" ON vendors;
DROP POLICY IF EXISTS "Vendor staff can view their own vendor" ON vendors;
DROP POLICY IF EXISTS "Admins can manage all vendors" ON vendors;
DROP POLICY IF EXISTS "Vendor staff can update their vendor" ON vendors;

CREATE POLICY "Authenticated users can view approved vendors"
ON vendors FOR SELECT
TO authenticated
USING (approval_status = 'approved' AND is_active = true);

CREATE POLICY "Vendor staff can view their own vendor"
ON vendors FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendor_staff
    WHERE vendor_staff.vendor_id = vendors.id
    AND vendor_staff.user_id = auth.uid()
    AND vendor_staff.is_active = true
  )
);

CREATE POLICY "Admins can manage all vendors"
ON vendors FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Vendor staff can update their vendor"
ON vendors FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendor_staff
    WHERE vendor_staff.vendor_id = vendors.id
    AND vendor_staff.user_id = auth.uid()
    AND vendor_staff.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vendor_staff
    WHERE vendor_staff.vendor_id = vendors.id
    AND vendor_staff.user_id = auth.uid()
    AND vendor_staff.is_active = true
  )
);

-- 6. Fix escalation_logs
ALTER TABLE escalation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view escalation logs" ON escalation_logs;
DROP POLICY IF EXISTS "System can create escalation logs" ON escalation_logs;

CREATE POLICY "Staff can view escalation logs"
ON escalation_logs FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "System can create escalation logs"
ON escalation_logs FOR INSERT
TO authenticated
WITH CHECK (is_staff(auth.uid()));

-- 7. Fix order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view items in their orders" ON order_items;
DROP POLICY IF EXISTS "Vendors can view items in their orders" ON order_items;
DROP POLICY IF EXISTS "System can create order items" ON order_items;

CREATE POLICY "Users can view items in their orders"
ON order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cafeteria_orders
    WHERE cafeteria_orders.id = order_items.order_id
    AND cafeteria_orders.user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can view items in their orders"
ON order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cafeteria_orders co
    JOIN vendor_staff vs ON vs.vendor_id = co.vendor_id
    WHERE co.id = order_items.order_id
    AND vs.user_id = auth.uid()
    AND vs.is_active = true
  )
);

CREATE POLICY "System can create order items"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cafeteria_orders
    WHERE cafeteria_orders.id = order_items.order_id
    AND cafeteria_orders.user_id = auth.uid()
  )
);

-- 8. Fix order_feedback
ALTER TABLE order_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create feedback for their orders" ON order_feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON order_feedback;
DROP POLICY IF EXISTS "Vendors can view feedback for their orders" ON order_feedback;

CREATE POLICY "Users can create feedback for their orders"
ON order_feedback FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cafeteria_orders
    WHERE cafeteria_orders.id = order_feedback.order_id
    AND cafeteria_orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own feedback"
ON order_feedback FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Vendors can view feedback for their orders"
ON order_feedback FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM vendor_staff
    WHERE vendor_staff.vendor_id = order_feedback.vendor_id
    AND vendor_staff.user_id = auth.uid()
    AND vendor_staff.is_active = true
  )
);