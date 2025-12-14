-- Add property_id column to maintenance_processes table
ALTER TABLE maintenance_processes 
ADD COLUMN property_id UUID REFERENCES properties(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_maintenance_processes_property_id ON maintenance_processes(property_id);

-- Backfill existing processes with SS Plaza's property ID
UPDATE maintenance_processes 
SET property_id = 'b91ccd9a-56ca-4021-a7c2-ac7d24473bf1' 
WHERE property_id IS NULL;

-- Make column NOT NULL after backfill
ALTER TABLE maintenance_processes ALTER COLUMN property_id SET NOT NULL;

-- Add RLS policy for property-based access
CREATE POLICY "property_scoped_maintenance_processes" ON maintenance_processes
FOR ALL USING (
  is_super_admin(auth.uid()) OR 
  is_admin(auth.uid()) OR 
  (is_staff(auth.uid()) AND property_id IN (
    SELECT property_id FROM property_assignments WHERE user_id = auth.uid()
  ))
);