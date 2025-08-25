-- Add new enum values for the unified workflow (commit them first)
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'en_route';