-- Step 2: Make property_id NOT NULL to prevent future issues
ALTER TABLE maintenance_requests
ALTER COLUMN property_id SET NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN maintenance_requests.property_id IS 'Required: Every maintenance request must be associated with a property';