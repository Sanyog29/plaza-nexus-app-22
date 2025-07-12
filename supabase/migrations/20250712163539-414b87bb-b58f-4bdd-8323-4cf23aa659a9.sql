-- Insert sample vendors
INSERT INTO public.vendors (id, name, description, logo_url, contact_email, contact_phone, commission_rate, is_active, stall_location, cuisine_type, average_rating) VALUES
('11111111-1111-1111-1111-111111111111', 'Tasty Bites', 'Delicious North Indian cuisine with authentic flavors', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400', 'contact@tastybites.com', '+91-9876543210', 15.00, true, 'Stall A1', 'North Indian', 4.5),
('22222222-2222-2222-2222-222222222222', 'South Spice', 'Traditional South Indian dishes and filter coffee', 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400', 'orders@southspice.com', '+91-9876543211', 12.00, true, 'Stall B2', 'South Indian', 4.3),
('33333333-3333-3333-3333-333333333333', 'Burger Junction', 'Fast food burgers, fries and shakes', 'https://images.unsplash.com/photo-1571091655789-405eb7a3a3a8?w=400', 'info@burgerjunction.com', '+91-9876543212', 18.00, true, 'Stall C3', 'Fast Food', 4.2),
('44444444-4444-4444-4444-444444444444', 'Green Garden', 'Fresh salads, healthy wraps and smoothies', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', 'hello@greengarden.com', '+91-9876543213', 10.00, true, 'Stall D4', 'Healthy', 4.6);

-- Insert menu categories
INSERT INTO public.cafeteria_menu_categories (id, vendor_id, name, description, is_featured, display_order) VALUES
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Main Course', 'Hearty main dishes', true, 1),
('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Breakfast', 'Traditional breakfast items', true, 1),
('c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Burgers', 'Juicy burgers and combos', true, 1),
('c4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Salads', 'Fresh and healthy salads', true, 1);

-- Insert menu items
INSERT INTO public.vendor_menu_items (id, vendor_id, category_id, name, description, price, image_url, is_available, is_featured, preparation_time_minutes, dietary_tags, stock_quantity, low_stock_threshold, average_rating) VALUES
('i1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Butter Chicken', 'Creamy tomato-based chicken curry', 250.00, 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400', true, true, 20, '{"non-veg"}', 50, 5, 4.7),
('i2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'Masala Dosa', 'Crispy dosa with spiced potato filling', 120.00, 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400', true, true, 15, '{"vegetarian", "vegan"}', 30, 3, 4.5),
('i3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'Classic Burger', 'Beef patty with lettuce, tomato, cheese', 180.00, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', true, true, 12, '{"non-veg"}', 25, 2, 4.3),
('i4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'Caesar Salad', 'Fresh romaine with caesar dressing', 150.00, 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', true, true, 8, '{"vegetarian"}', 20, 2, 4.4);

-- Insert sample offers
INSERT INTO public.vendor_offers (id, vendor_id, title, description, discount_type, discount_value, minimum_order_amount, offer_code, start_date, end_date, usage_limit, is_active) VALUES
('o1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'First Order Discount', 'Get 20% off on your first order', 'percentage', 20.00, 200.00, 'FIRST20', '2024-01-01', '2024-12-31', 100, true),
('o2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Weekend Special', 'Flat ₹50 off on weekend orders', 'fixed', 50.00, 150.00, 'WEEKEND50', '2024-01-01', '2024-12-31', 200, true);