-- Add soft delete columns to maintenance_requests
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_deleted_at 
ON maintenance_requests(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Update existing queries to exclude soft-deleted records by default
-- Create a view for active (non-deleted) requests
CREATE OR REPLACE VIEW active_maintenance_requests AS
SELECT * FROM maintenance_requests
WHERE deleted_at IS NULL;

-- Create function to soft delete requests in bulk
CREATE OR REPLACE FUNCTION soft_delete_maintenance_requests(
  request_ids UUID[],
  deleted_by_user UUID
)
RETURNS JSONB AS $$
DECLARE
  affected_count INTEGER;
  result JSONB;
BEGIN
  -- Validate user has permission
  IF NOT (SELECT is_admin(deleted_by_user) OR is_staff(deleted_by_user)) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and staff can delete requests';
  END IF;

  -- Perform soft delete
  UPDATE maintenance_requests
  SET 
    deleted_at = NOW(),
    deleted_by = deleted_by_user,
    updated_at = NOW()
  WHERE id = ANY(request_ids)
    AND deleted_at IS NULL;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Log the bulk deletion
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    new_values
  ) VALUES (
    deleted_by_user,
    'bulk_soft_delete',
    'maintenance_requests',
    jsonb_build_object(
      'deleted_count', affected_count,
      'request_ids', request_ids,
      'timestamp', NOW()
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'deleted_count', affected_count,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to permanently delete soft-deleted requests (admin only)
CREATE OR REPLACE FUNCTION permanent_delete_old_requests(
  days_old INTEGER DEFAULT 90
)
RETURNS JSONB AS $$
DECLARE
  affected_count INTEGER;
  result JSONB;
BEGIN
  -- Only allow admins to permanently delete
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can permanently delete requests';
  END IF;

  -- Permanently delete requests that have been soft-deleted for X days
  DELETE FROM maintenance_requests
  WHERE deleted_at IS NOT NULL
    AND deleted_at < (NOW() - (days_old || ' days')::INTERVAL);
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  result := jsonb_build_object(
    'success', true,
    'permanently_deleted_count', affected_count,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to restore soft-deleted requests
CREATE OR REPLACE FUNCTION restore_soft_deleted_requests(
  request_ids UUID[]
)
RETURNS JSONB AS $$
DECLARE
  affected_count INTEGER;
  result JSONB;
BEGIN
  -- Validate user has permission
  IF NOT (SELECT is_admin(auth.uid()) OR is_staff(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and staff can restore requests';
  END IF;

  -- Restore soft deleted requests
  UPDATE maintenance_requests
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = NOW()
  WHERE id = ANY(request_ids)
    AND deleted_at IS NOT NULL;
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  -- Log the restoration
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    new_values
  ) VALUES (
    auth.uid(),
    'bulk_restore',
    'maintenance_requests',
    jsonb_build_object(
      'restored_count', affected_count,
      'request_ids', request_ids,
      'timestamp', NOW()
    )
  );
  
  result := jsonb_build_object(
    'success', true,
    'restored_count', affected_count,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;