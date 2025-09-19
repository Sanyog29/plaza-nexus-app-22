-- Remove GST/tax related database structures
-- Drop order_taxes table entirely
DROP TABLE IF EXISTS order_taxes CASCADE;

-- Remove gst_number column from vendors table
ALTER TABLE vendors DROP COLUMN IF EXISTS gst_number;