-- Fix the trigger timing - it should be AFTER INSERT/UPDATE, not BEFORE
-- This ensures the maintenance request is fully inserted before trying to insert status history

-- Drop the existing trigger
DROP TRIGGER IF EXISTS track_request_status_change_trigger ON maintenance_requests;

-- Recreate the trigger to run AFTER INSERT/UPDATE
CREATE TRIGGER track_request_status_change_trigger
    AFTER INSERT OR UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION track_request_status_change();