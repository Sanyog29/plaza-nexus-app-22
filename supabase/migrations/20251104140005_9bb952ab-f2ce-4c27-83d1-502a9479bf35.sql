-- Migration: Fix requisition_lists foreign keys to point to profiles
-- Created: 2025-11-04
-- Purpose: Align user references with proper schema design

BEGIN;

-- Update created_by foreign key
ALTER TABLE requisition_lists
DROP CONSTRAINT IF EXISTS requisition_lists_created_by_fkey;

ALTER TABLE requisition_lists
ADD CONSTRAINT requisition_lists_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- Update manager_id foreign key
ALTER TABLE requisition_lists
DROP CONSTRAINT IF EXISTS requisition_lists_manager_id_fkey;

ALTER TABLE requisition_lists
ADD CONSTRAINT requisition_lists_manager_id_fkey
FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Update assigned_to foreign key
ALTER TABLE requisition_lists
DROP CONSTRAINT IF EXISTS requisition_lists_assigned_to_fkey;

ALTER TABLE requisition_lists
ADD CONSTRAINT requisition_lists_assigned_to_fkey
FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;

-- Update assigned_by foreign key
ALTER TABLE requisition_lists
DROP CONSTRAINT IF EXISTS requisition_lists_assigned_by_fkey;

ALTER TABLE requisition_lists
ADD CONSTRAINT requisition_lists_assigned_by_fkey
FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL;

COMMIT;