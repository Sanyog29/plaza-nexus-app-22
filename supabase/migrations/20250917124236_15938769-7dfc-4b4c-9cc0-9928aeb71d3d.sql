-- Simply add vendor_id to menu categories and create some sample data
ALTER TABLE cafeteria_menu_categories 
ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id);

-- Insert a sample vendor if none exists
INSERT INTO vendors (name, description, contact_email, contact_phone, commission_rate, is_active, approval_status, cuisine_type, stall_location)
SELECT 'Delhi Food Hub', 'Authentic North Indian cuisine', 'vendor@delhifoodhub.com', '+91-9876543210', 15.0, true, 'approved', 'North Indian', 'Food Court - Stall 1'
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = 'Delhi Food Hub');

-- Link existing menu categories to the first vendor
UPDATE cafeteria_menu_categories 
SET vendor_id = (SELECT id FROM vendors WHERE is_active = true LIMIT 1)
WHERE vendor_id IS NULL;

-- Insert some sample categories and items if none exist
DO $$
DECLARE
    vendor_uuid uuid;
    starter_cat_id uuid;
    main_cat_id uuid;
    beverage_cat_id uuid;
    dessert_cat_id uuid;
BEGIN
    -- Get the vendor
    SELECT id INTO vendor_uuid FROM vendors WHERE is_active = true LIMIT 1;
    
    -- Insert categories if they don't exist
    INSERT INTO cafeteria_menu_categories (name, description, display_order, vendor_id, is_featured)
    SELECT 'Starters', 'Delicious appetizers and snacks', 1, vendor_uuid, true
    WHERE NOT EXISTS (SELECT 1 FROM cafeteria_menu_categories WHERE name = 'Starters' AND vendor_id = vendor_uuid);
    
    INSERT INTO cafeteria_menu_categories (name, description, display_order, vendor_id, is_featured)
    SELECT 'Main Course', 'Hearty main dishes and curries', 2, vendor_uuid, false
    WHERE NOT EXISTS (SELECT 1 FROM cafeteria_menu_categories WHERE name = 'Main Course' AND vendor_id = vendor_uuid);
    
    INSERT INTO cafeteria_menu_categories (name, description, display_order, vendor_id, is_featured)
    SELECT 'Beverages', 'Hot and cold drinks', 3, vendor_uuid, false
    WHERE NOT EXISTS (SELECT 1 FROM cafeteria_menu_categories WHERE name = 'Beverages' AND vendor_id = vendor_uuid);
    
    INSERT INTO cafeteria_menu_categories (name, description, display_order, vendor_id, is_featured)
    SELECT 'Desserts', 'Sweet treats and traditional sweets', 4, vendor_uuid, false
    WHERE NOT EXISTS (SELECT 1 FROM cafeteria_menu_categories WHERE name = 'Desserts' AND vendor_id = vendor_uuid);
    
    -- Get category IDs
    SELECT id INTO starter_cat_id FROM cafeteria_menu_categories WHERE name = 'Starters' AND vendor_id = vendor_uuid;
    SELECT id INTO main_cat_id FROM cafeteria_menu_categories WHERE name = 'Main Course' AND vendor_id = vendor_uuid;
    SELECT id INTO beverage_cat_id FROM cafeteria_menu_categories WHERE name = 'Beverages' AND vendor_id = vendor_uuid;
    SELECT id INTO dessert_cat_id FROM cafeteria_menu_categories WHERE name = 'Desserts' AND vendor_id = vendor_uuid;
    
    -- Insert sample menu items if none exist in each category
    IF starter_cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cafeteria_menu_items WHERE category_id = starter_cat_id) THEN
        INSERT INTO cafeteria_menu_items (name, description, price, category_id, is_available, is_vegetarian, is_vegan)
        VALUES 
            ('Samosa (2 pcs)', 'Crispy pastry triangles filled with spiced potatoes and peas', 25.00, starter_cat_id, true, true, true),
            ('Paneer Tikka', 'Marinated cottage cheese cubes grilled to perfection', 120.00, starter_cat_id, true, true, false);
    END IF;
    
    IF main_cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cafeteria_menu_items WHERE category_id = main_cat_id) THEN
        INSERT INTO cafeteria_menu_items (name, description, price, category_id, is_available, is_vegetarian, is_vegan)
        VALUES 
            ('Paneer Butter Masala', 'Rich and creamy cottage cheese curry with butter', 180.00, main_cat_id, true, true, false),
            ('Dal Tadka', 'Yellow lentils tempered with aromatic spices', 120.00, main_cat_id, true, true, true);
    END IF;
    
    IF beverage_cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cafeteria_menu_items WHERE category_id = beverage_cat_id) THEN
        INSERT INTO cafeteria_menu_items (name, description, price, category_id, is_available, is_vegetarian, is_vegan)
        VALUES 
            ('Masala Chai', 'Traditional Indian spiced tea', 15.00, beverage_cat_id, true, true, true),
            ('Fresh Lime Soda', 'Refreshing lime drink with mint', 25.00, beverage_cat_id, true, true, true);
    END IF;
    
    IF dessert_cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM cafeteria_menu_items WHERE category_id = dessert_cat_id) THEN
        INSERT INTO cafeteria_menu_items (name, description, price, category_id, is_available, is_vegetarian, is_vegan)
        VALUES 
            ('Gulab Jamun (2 pcs)', 'Soft milk dumplings in rose-flavored syrup', 40.00, dessert_cat_id, true, true, false),
            ('Kulfi', 'Traditional Indian ice cream', 30.00, dessert_cat_id, true, true, false);
    END IF;
    
END $$;