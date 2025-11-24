
-- PHASE 1a: Add bms_operator to app_role enum
-- This must be done in a separate transaction before using the value

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'bms_operator';

-- Verification
SELECT 
  'bms_operator_added' as check_name,
  EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'bms_operator'
  ) as value_exists;
