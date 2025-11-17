-- Phase 2: Migrate Legacy NULL Requests to SS Plaza

-- Step 1: Create backup of affected records
CREATE TEMP TABLE backup_legacy_requests AS
SELECT id, created_at, status, priority, property_id
FROM maintenance_requests 
WHERE property_id IS NULL AND deleted_at IS NULL;

-- Step 2: Migrate all NULL property_id to SS Plaza
UPDATE maintenance_requests
SET 
  property_id = 'b91ccd9a-56ca-4021-a7c2-ac7d24473bf1',  -- SS Plaza
  updated_at = NOW()
WHERE property_id IS NULL
  AND deleted_at IS NULL;

-- Step 3: Verification query (for logging)
-- This will show the property distribution after migration
SELECT 
  p.name as property_name,
  COUNT(*) as request_count
FROM maintenance_requests mr
LEFT JOIN properties p ON mr.property_id = p.id
WHERE mr.deleted_at IS NULL
GROUP BY p.name
ORDER BY request_count DESC;