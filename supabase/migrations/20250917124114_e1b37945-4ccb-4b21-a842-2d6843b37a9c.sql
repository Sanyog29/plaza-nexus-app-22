-- Add vendor_id to menu categories and create sample data with correct vendor table structure
ALTER TABLE cafeteria_menu_categories 
ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id);

-- Create sample data for testing the POS system
DO $$
DECLARE
    vendor_uuid uuid;
    starter_cat_id uuid;
    main_cat_id uuid;
    beverage_cat_id uuid;
    dessert_cat_id uuid;
BEGIN
    -- Insert or get a sample vendor using correct column names
    INSERT INTO vendors (name, description, contact_email, contact_phone, commission_rate, is_active, approval_status, cuisine_type, stall_location)
    VALUES ('Delhi Food Hub', 'Authentic North Indian cuisine', 'vendor@delhifoodhub.com', '+91-9876543210', 15.0, true, 'approved', 'North Indian', 'Food Court - Stall 1')
    ON CONFLICT (contact_email) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description
    RETURNING id INTO vendor_uuid;
    
    -- If no vendor was inserted (conflict), get existing one
    IF vendor_uuid IS NULL THEN
        SELECT id INTO vendor_uuid FROM vendors WHERE is_active = true LIMIT 1;
    END IF;
    
    -- Update existing categories to link to this vendor if they don't have vendor_id
    UPDATE cafeteria_menu_categories 
    SET vendor_id = vendor_uuid 
    WHERE vendor_id IS NULL;
    
    -- Insert sample categories
    INSERT INTO cafeteria_menu_categories (name, description, display_order, vendor_id, is_featured)
    VALUES 
        ('Starters', 'Delicious appetizers and snacks', 1, vendor_uuid, true),
        ('Main Course', 'Hearty main dishes and curries', 2, vendor_uuid, false),
        ('Beverages', 'Hot and cold drinks', 3, vendor_uuid, false),
        ('Desserts', 'Sweet treats and traditional sweets', 4, vendor_uuid, false)
    ON CONFLICT DO NOTHING;
    
    -- Get category IDs
    SELECT id INTO starter_cat_id FROM cafeteria_menu_categories WHERE name = 'Starters' AND vendor_id = vendor_uuid;
    SELECT id INTO main_cat_id FROM cafeteria_menu_categories WHERE name = 'Main Course' AND vendor_id = vendor_uuid;
    SELECT id INTO beverage_cat_id FROM cafeteria_menu_categories WHERE name = 'Beverages' AND vendor_id = vendor_uuid;
    SELECT id INTO dessert_cat_id FROM cafeteria_menu_categories WHERE name = 'Desserts' AND vendor_id = vendor_uuid;
    
    -- Insert sample menu items only if categories exist
    IF starter_cat_id IS NOT NULL THEN
        INSERT INTO cafeteria_menu_items (name, description, price, category_id, is_available, is_vegetarian, is_vegan)
        VALUES 
            ('Samosa (2 pcs)', 'Crispy pastry triangles filled with spiced potatoes and peas', 25.00, starter_cat_id, true, true, true),
            ('Paneer Tikka', 'Marinated cottage cheese cubes grilled to perfection', 120.00, starter_cat_id, true, true, false),
            ('Aloo Chaat', 'Spicy potato chat with tangy chutneys', 35.00, starter_cat_id, true, true, true)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF main_cat_id IS NOT NULL THEN
        INSERT INTO cafeteria_menu_items (name, description, price, category_id, is_available, is_vegetarian, is_vegan)
        VALUES 
            ('Paneer Butter Masala', 'Rich and creamy cottage cheese curry with butter', 180.00, main_cat_id, true, true, false),
            ('Dal Tadka', 'Yellow lentils tempered with aromatic spices', 120.00, main_cat_id, true, true, true),
            ('Rajma Rice Bowl', 'Kidney bean curry served with steamed rice', 150.00, main_cat_id, true, true, true),
            ('Chole Bhature', 'Spicy chickpea curry with fried bread', 140.00, main_cat_id, true, true, false)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF beverage_cat_id IS NOT NULL THEN
        INSERT INTO cafeteria_menu_items (name, description, price, category_id, is_available, is_vegetarian, is_vegan)
        VALUES 
            ('Masala Chai', 'Traditional Indian spiced tea', 15.00, beverage_cat_id, true, true, true),
            ('Fresh Lime Soda', 'Refreshing lime drink with mint', 25.00, beverage_cat_id, true, true, true),
            ('Lassi (Sweet)', 'Creamy yogurt-based drink', 35.00, beverage_cat_id, true, true, false)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF dessert_cat_id IS NOT NULL THEN
        INSERT INTO cafeteria_menu_items (name, description, price, category_id, is_available, is_vegetarian, is_vegan)
        VALUES 
            ('Gulab Jamun (2 pcs)', 'Soft milk dumplings in rose-flavored syrup', 40.00, dessert_cat_id, true, true, false),
            ('Kulfi', 'Traditional Indian ice cream', 30.00, dessert_cat_id, true, true, false),
            ('Jalebi', 'Crispy spirals soaked in sugar syrup', 35.00, dessert_cat_id, true, true, true)
        ON CONFLICT DO NOTHING;
    END IF;
    
END $$;