-- ============================================
-- CRITICAL SECURITY FIX: Property Isolation
-- Prevents cross-property data leakage
-- ============================================

-- Step 1: Create helper function for property access check
CREATE OR REPLACE FUNCTION public.user_has_property_access(
  _user_id uuid,
  _property_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Super admins have access to all properties
  SELECT public.is_super_admin(_user_id)
  OR EXISTS (
    SELECT 1 FROM property_assignments
    WHERE user_id = _user_id 
    AND property_id = _property_id
  );
$$;

-- Step 2: Drop dangerous blanket staff policies on maintenance_requests
DROP POLICY IF EXISTS "Staff can view all maintenance requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Staff can manage all requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Technicians can view assigned requests" ON maintenance_requests;
DROP POLICY IF EXISTS "Users can view own requests" ON maintenance_requests;

-- Step 3: Create property-scoped RLS policies for maintenance_requests
CREATE POLICY "Property-scoped request viewing"
ON maintenance_requests FOR SELECT
TO authenticated
USING (
  -- Super admins see everything
  public.is_super_admin(auth.uid())
  OR
  -- Regular admins see everything (for now - should be scoped later)
  public.is_admin(auth.uid())
  OR
  -- Staff see only requests in their assigned properties
  (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
  OR
  -- Users see their own requests
  reported_by = auth.uid()
);

CREATE POLICY "Property-scoped request management"
ON maintenance_requests FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
  OR reported_by = auth.uid()
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
  OR reported_by = auth.uid()
);

-- Step 4: Apply same pattern to assets table
DROP POLICY IF EXISTS "Users can view assets based on property access" ON assets;
DROP POLICY IF EXISTS "Staff can manage assets" ON assets;

CREATE POLICY "Property-scoped asset viewing"
ON assets FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Property-scoped asset management"
ON assets FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
);

-- Step 5: Add NOT NULL constraint to maintenance_requests.property_id
-- First, update any remaining NULL values to a default property
DO $$
DECLARE
  default_property_id uuid;
BEGIN
  -- Get the first active property as default
  SELECT id INTO default_property_id
  FROM properties
  WHERE status = 'active'
  ORDER BY created_at
  LIMIT 1;
  
  -- Update NULL property_id records if default exists
  IF default_property_id IS NOT NULL THEN
    UPDATE maintenance_requests
    SET property_id = default_property_id
    WHERE property_id IS NULL;
  END IF;
END $$;

-- Now add NOT NULL constraint
ALTER TABLE maintenance_requests 
ALTER COLUMN property_id SET NOT NULL;

-- Step 6: Apply NOT NULL to assets.property_id
DO $$
DECLARE
  default_property_id uuid;
BEGIN
  SELECT id INTO default_property_id
  FROM properties
  WHERE status = 'active'
  ORDER BY created_at
  LIMIT 1;
  
  IF default_property_id IS NOT NULL THEN
    UPDATE assets
    SET property_id = default_property_id
    WHERE property_id IS NULL;
  END IF;
END $$;

ALTER TABLE assets 
ALTER COLUMN property_id SET NOT NULL;

-- Step 7: Apply to deliveries table
DROP POLICY IF EXISTS "Users can view deliveries" ON deliveries;

CREATE POLICY "Property-scoped delivery viewing"
ON deliveries FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Property-scoped delivery management"
ON deliveries FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
);

-- Step 8: Apply to cafeteria_orders table
DROP POLICY IF EXISTS "Users can view cafeteria orders" ON cafeteria_orders;

CREATE POLICY "Property-scoped cafeteria order viewing"
ON cafeteria_orders FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Property-scoped cafeteria order management"
ON cafeteria_orders FOR ALL
TO authenticated
USING (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_super_admin(auth.uid())
  OR public.is_admin(auth.uid())
  OR (
    public.is_staff(auth.uid())
    AND property_id IN (
      SELECT property_id 
      FROM property_assignments 
      WHERE user_id = auth.uid()
    )
  )
  OR user_id = auth.uid()
);

-- Step 9: Create audit log for property access violations
CREATE TABLE IF NOT EXISTS property_access_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  attempted_property_id uuid REFERENCES properties(id),
  user_assigned_properties uuid[],
  violation_type text NOT NULL,
  table_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Grant access to authenticated users
GRANT SELECT, INSERT ON property_access_violations TO authenticated;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_access_violations_user 
ON property_access_violations(user_id, created_at DESC);

COMMENT ON TABLE property_access_violations IS 
'Logs attempted cross-property data access for security auditing';

-- Step 10: Grant execute permissions on helper function
GRANT EXECUTE ON FUNCTION public.user_has_property_access(uuid, uuid) TO authenticated;