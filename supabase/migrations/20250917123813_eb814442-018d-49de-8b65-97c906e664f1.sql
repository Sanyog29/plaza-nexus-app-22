-- First, let's link existing menu categories to vendors (assuming you want to assign them to a specific vendor)
-- We'll need to add vendor_id to cafeteria_menu_categories and cafeteria_menu_items

-- Update menu categories table to include vendor_id if not already present
ALTER TABLE cafeteria_menu_categories 
ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id);

-- Update menu items to ensure they're properly linked to categories with vendor associations
-- First let's create some sample data if the tables are empty

-- Insert sample vendor if none exists
INSERT INTO vendors (name, contact_person, phone_number, email, commission_rate, is_active, approval_status)
VALUES ('Sample Food Vendor', 'John Doe', '+91-9876543210', 'vendor@example.com', 15.0, true, 'approved')
ON CONFLICT DO NOTHING;

-- Get the vendor ID for linking
DO $$
DECLARE
    vendor_uuid uuid;
BEGIN
    -- Get the first active vendor
    SELECT id INTO vendor_uuid FROM vendors WHERE is_active = true LIMIT 1;
    
    -- Update existing categories to link to this vendor if they don't have vendor_id
    UPDATE cafeteria_menu_categories 
    SET vendor_id = vendor_uuid 
    WHERE vendor_id IS NULL;
    
    -- Insert sample categories if none exist
    INSERT INTO cafeteria_menu_categories (name, description, display_order, vendor_id, is_featured)
    SELECT * FROM (VALUES 
        ('Starters', 'Delicious appetizers and snacks', 1, vendor_uuid, true),
        ('Main Course', 'Hearty main dishes', 2, vendor_uuid, false),
        ('Beverages', 'Hot and cold drinks', 3, vendor_uuid, false),
        ('Desserts', 'Sweet treats', 4, vendor_uuid, false)
    ) AS new_categories(name, description, display_order, vendor_id, is_featured)
    WHERE NOT EXISTS (SELECT 1 FROM cafeteria_menu_categories WHERE vendor_id = vendor_uuid);
    
    -- Insert sample menu items if none exist
    INSERT INTO cafeteria_menu_items (name, description, price, category_id, is_available, is_vegetarian, is_vegan)
    SELECT * FROM (VALUES 
        ('Samosa', 'Crispy pastry with spiced potato filling', 25.00, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Starters' AND vendor_id = vendor_uuid LIMIT 1), true, true, true),
        ('Paneer Butter Masala', 'Rich and creamy paneer curry', 180.00, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Main Course' AND vendor_id = vendor_uuid LIMIT 1), true, true, false),
        ('Dal Tadka', 'Yellow lentils tempered with spices', 120.00, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Main Course' AND vendor_id = vendor_uuid LIMIT 1), true, true, true),
        ('Masala Chai', 'Traditional spiced tea', 15.00, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Beverages' AND vendor_id = vendor_uuid LIMIT 1), true, true, true),
        ('Gulab Jamun', 'Sweet milk dumplings in syrup', 40.00, (SELECT id FROM cafeteria_menu_categories WHERE name = 'Desserts' AND vendor_id = vendor_uuid LIMIT 1), true, true, false)
    ) AS new_items(name, description, price, category_id, is_available, is_vegetarian, is_vegan)
    WHERE NOT EXISTS (SELECT 1 FROM cafeteria_menu_items);
END $$;