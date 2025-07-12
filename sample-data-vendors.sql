-- Sample data for multi-vendor cafeteria system
-- This can be run in Supabase SQL editor to populate the database

-- Insert sample vendors
INSERT INTO public.vendors (id, name, description, logo_url, contact_email, contact_phone, commission_rate, is_active, stall_location, cuisine_type, average_rating) VALUES
('11111111-1111-1111-1111-111111111111', 'Spice Garden', 'Authentic Indian cuisine with a modern twist', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=100&h=100&fit=crop&crop=center', 'contact@spicegarden.com', '+91-9876543210', 10.00, true, 'Stall A1', 'Indian', 4.5),
('22222222-2222-2222-2222-222222222222', 'Green Bowl', 'Healthy salads, smoothies and vegan options', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=100&h=100&fit=crop&crop=center', 'hello@greenbowl.com', '+91-9876543211', 10.00, true, 'Stall A2', 'Healthy', 4.3),
('33333333-3333-3333-3333-333333333333', 'Pasta Corner', 'Fresh Italian pasta and pizzas', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=100&h=100&fit=crop&crop=center', 'info@pastacorner.com', '+91-9876543212', 10.00, true, 'Stall B1', 'Italian', 4.2),
('44444444-4444-4444-4444-444444444444', 'Snack Attack', 'Quick bites, sandwiches and beverages', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop&crop=center', 'orders@snackattack.com', '+91-9876543213', 10.00, true, 'Stall B2', 'Fast Food', 4.0),
('55555555-5555-5555-5555-555555555555', 'Chai Masters', 'Traditional Indian teas and snacks', 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=100&h=100&fit=crop&crop=center', 'contact@chaimasters.com', '+91-9876543214', 10.00, true, 'Stall C1', 'Beverages', 4.4);

-- Insert menu categories for vendors
INSERT INTO public.cafeteria_menu_categories (id, vendor_id, name, description, is_featured, display_order) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Main Course', 'Traditional Indian main dishes', true, 1),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Appetizers', 'Starters and snacks', false, 2),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Salads', 'Fresh and healthy salad bowls', true, 1),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Smoothies', 'Fresh fruit and veggie smoothies', false, 2),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'Pasta', 'Fresh handmade pasta dishes', true, 1),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'Pizza', 'Wood-fired artisan pizzas', false, 2);

-- Insert sample menu items
INSERT INTO public.vendor_menu_items (id, vendor_id, category_id, name, description, price, image_url, is_available, is_featured, preparation_time_minutes, dietary_tags, stock_quantity, low_stock_threshold, average_rating) VALUES
-- Spice Garden items
('item0001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Butter Chicken', 'Creamy tomato-based chicken curry with aromatic spices', 320.00, 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', true, true, 20, ARRAY['gluten-free'], 15, 5, 4.6),
('item0001-0001-0001-0001-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Paneer Tikka Masala', 'Grilled cottage cheese in rich tomato gravy', 280.00, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&h=300&fit=crop', true, false, 18, ARRAY['vegetarian', 'gluten-free'], 12, 5, 4.4),
('item0001-0001-0001-0001-000000000003', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Samosa Chat', 'Crispy samosas topped with chutneys and yogurt', 120.00, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop', true, false, 10, ARRAY['vegetarian'], 20, 5, 4.2),

-- Green Bowl items
('item0002-0002-0002-0002-000000000001', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mediterranean Bowl', 'Quinoa, olives, feta, cucumber, tomatoes with olive oil dressing', 250.00, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', true, true, 8, ARRAY['vegetarian', 'gluten-free'], 18, 5, 4.5),
('item0002-0002-0002-0002-000000000002', '22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Power Protein Salad', 'Grilled chicken, chickpeas, avocado, mixed greens', 320.00, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', true, false, 12, ARRAY['high-protein', 'gluten-free'], 15, 5, 4.3),
('item0002-0002-0002-0002-000000000003', '22222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Green Goddess Smoothie', 'Spinach, banana, mango, coconut water, chia seeds', 180.00, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop', true, false, 5, ARRAY['vegan', 'gluten-free'], 25, 10, 4.4),

-- Pasta Corner items
('item0003-0003-0003-0003-000000000001', '33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Truffle Mushroom Pasta', 'Creamy pasta with wild mushrooms and truffle oil', 380.00, 'https://images.unsplash.com/photo-1621996346565-e3dbc13d1923?w=400&h=300&fit=crop', true, true, 15, ARRAY['vegetarian'], 10, 3, 4.7),
('item0003-0003-0003-0003-000000000002', '33333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Spicy Arrabbiata', 'Penne pasta in spicy tomato sauce with herbs', 280.00, 'https://images.unsplash.com/photo-1572441713132-51c75654db73?w=400&h=300&fit=crop', true, false, 12, ARRAY['vegetarian', 'spicy'], 14, 5, 4.2),
('item0003-0003-0003-0003-000000000003', '33333333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Margherita Pizza', 'Fresh mozzarella, basil, tomato sauce on thin crust', 350.00, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop', true, false, 18, ARRAY['vegetarian'], 8, 3, 4.5),

-- Snack Attack items
('item0004-0004-0004-0004-000000000001', '44444444-4444-4444-4444-444444444444', null, 'Club Sandwich', 'Triple-layer sandwich with chicken, bacon, lettuce, tomato', 220.00, 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400&h=300&fit=crop', true, false, 8, ARRAY[], 20, 5, 4.1),
('item0004-0004-0004-0004-000000000002', '44444444-4444-4444-4444-444444444444', null, 'Veg Grilled Sandwich', 'Grilled sandwich with cheese, tomato, cucumber', 150.00, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop', true, false, 6, ARRAY['vegetarian'], 25, 10, 3.9),
('item0004-0004-0004-0004-000000000003', '44444444-4444-4444-4444-444444444444', null, 'French Fries', 'Crispy golden fries with mayo and ketchup', 120.00, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop', true, false, 8, ARRAY['vegetarian'], 30, 10, 4.0),

-- Chai Masters items
('item0005-0005-0005-0005-000000000001', '55555555-5555-5555-5555-555555555555', null, 'Masala Chai', 'Traditional spiced tea with cardamom, ginger, cinnamon', 40.00, 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop', true, true, 5, ARRAY['vegetarian'], 50, 20, 4.6),
('item0005-0005-0005-0005-000000000002', '55555555-5555-5555-5555-555555555555', null, 'Kulhad Coffee', 'Filter coffee served in traditional clay cup', 50.00, 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop', true, false, 3, ARRAY['vegetarian'], 40, 15, 4.3),
('item0005-0005-0005-0005-000000000003', '55555555-5555-5555-5555-555555555555', null, 'Vada Pav', 'Mumbai street food - spiced potato fritter in bread', 60.00, 'https://images.unsplash.com/photo-1626132647523-66f5bf97f4e8?w=400&h=300&fit=crop', true, false, 8, ARRAY['vegetarian'], 30, 10, 4.4);

-- Insert some sample offers
INSERT INTO public.vendor_offers (id, vendor_id, title, description, discount_type, discount_value, minimum_order_amount, offer_code, start_date, end_date, usage_limit, is_active) VALUES
('offer001-0001-0001-0001-000000000001', '11111111-1111-1111-1111-111111111111', 'Lunch Special', '20% off on orders above ₹300', 'percentage', 20.00, 300.00, 'LUNCH20', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 100, true),
('offer002-0002-0002-0002-000000000002', '22222222-2222-2222-2222-222222222222', 'Healthy Monday', 'Get ₹50 off on any salad', 'fixed_amount', 50.00, 200.00, 'HEALTHMON', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 50, true),
('offer003-0003-0003-0003-000000000003', '33333333-3333-3333-3333-333333333333', 'Buy 1 Get 1', 'Buy any pasta, get pizza at 50% off', 'percentage', 50.00, 500.00, 'BOGO50', CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', 25, true);