-- Add half_plate_price column to vendor_menu_items table
ALTER TABLE vendor_menu_items 
ADD COLUMN half_plate_price NUMERIC(10,2) NULL;

-- Add index for better query performance on pricing
CREATE INDEX idx_vendor_menu_items_pricing ON vendor_menu_items(price, half_plate_price);

-- Add constraint to ensure half_plate_price is positive when provided
ALTER TABLE vendor_menu_items 
ADD CONSTRAINT check_half_plate_price_positive 
CHECK (half_plate_price IS NULL OR half_plate_price > 0);

-- Add constraint to ensure full plate price is always positive
ALTER TABLE vendor_menu_items 
ADD CONSTRAINT check_full_plate_price_positive 
CHECK (price > 0);