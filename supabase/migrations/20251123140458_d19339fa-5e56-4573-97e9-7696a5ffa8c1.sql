-- Enable RLS on property_access_violations table
ALTER TABLE property_access_violations ENABLE ROW LEVEL SECURITY;

-- Only admins and super admins can view access violations
CREATE POLICY "Admins can view property access violations"
ON property_access_violations FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
);

-- System can insert violation logs (for any authenticated user)
CREATE POLICY "System can log property access violations"
ON property_access_violations FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());