-- Step 1: Fix NULL property_id by assigning to SS Plaza
UPDATE maintenance_requests
SET property_id = 'b91ccd9a-56ca-4021-a7c2-ac7d24473bf1'
WHERE property_id IS NULL;