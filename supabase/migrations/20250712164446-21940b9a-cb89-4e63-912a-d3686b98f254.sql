-- Insert menu items with proper relationships
WITH vendor_categories AS (
  SELECT v.id as vendor_id, v.name as vendor_name, c.id as category_id
  FROM vendors v
  JOIN cafeteria_menu_categories c ON v.id = c.vendor_id
)
INSERT INTO public.vendor_menu_items (vendor_id, category_id, name, description, price, image_url, is_available, is_featured, preparation_time_minutes, dietary_tags, stock_quantity, low_stock_threshold, average_rating)
SELECT 
  vc.vendor_id,
  vc.category_id,
  CASE 
    WHEN vc.vendor_name = 'Tasty Bites' THEN 'Butter Chicken'
    WHEN vc.vendor_name = 'South Spice' THEN 'Masala Dosa'
    WHEN vc.vendor_name = 'Burger Junction' THEN 'Classic Burger'
    WHEN vc.vendor_name = 'Green Garden' THEN 'Caesar Salad'
  END as name,
  CASE 
    WHEN vc.vendor_name = 'Tasty Bites' THEN 'Creamy tomato-based chicken curry'
    WHEN vc.vendor_name = 'South Spice' THEN 'Crispy dosa with spiced potato filling'
    WHEN vc.vendor_name = 'Burger Junction' THEN 'Beef patty with lettuce, tomato, cheese'
    WHEN vc.vendor_name = 'Green Garden' THEN 'Fresh romaine with caesar dressing'
  END as description,
  CASE 
    WHEN vc.vendor_name = 'Tasty Bites' THEN 250.00
    WHEN vc.vendor_name = 'South Spice' THEN 120.00
    WHEN vc.vendor_name = 'Burger Junction' THEN 180.00
    WHEN vc.vendor_name = 'Green Garden' THEN 150.00
  END as price,
  CASE 
    WHEN vc.vendor_name = 'Tasty Bites' THEN 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400'
    WHEN vc.vendor_name = 'South Spice' THEN 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400'
    WHEN vc.vendor_name = 'Burger Junction' THEN 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
    WHEN vc.vendor_name = 'Green Garden' THEN 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400'
  END as image_url,
  true as is_available,
  true as is_featured,
  CASE 
    WHEN vc.vendor_name = 'Tasty Bites' THEN 20
    WHEN vc.vendor_name = 'South Spice' THEN 15
    WHEN vc.vendor_name = 'Burger Junction' THEN 12
    WHEN vc.vendor_name = 'Green Garden' THEN 8
  END as preparation_time_minutes,
  CASE 
    WHEN vc.vendor_name = 'Tasty Bites' THEN ARRAY['non-veg']
    WHEN vc.vendor_name = 'South Spice' THEN ARRAY['vegetarian', 'vegan']
    WHEN vc.vendor_name = 'Burger Junction' THEN ARRAY['non-veg']
    WHEN vc.vendor_name = 'Green Garden' THEN ARRAY['vegetarian']
  END as dietary_tags,
  CASE 
    WHEN vc.vendor_name = 'Tasty Bites' THEN 50
    WHEN vc.vendor_name = 'South Spice' THEN 30
    WHEN vc.vendor_name = 'Burger Junction' THEN 25
    WHEN vc.vendor_name = 'Green Garden' THEN 20
  END as stock_quantity,
  CASE 
    WHEN vc.vendor_name = 'Tasty Bites' THEN 5
    WHEN vc.vendor_name = 'South Spice' THEN 3
    WHEN vc.vendor_name = 'Burger Junction' THEN 2
    WHEN vc.vendor_name = 'Green Garden' THEN 2
  END as low_stock_threshold,
  CASE 
    WHEN vc.vendor_name = 'Tasty Bites' THEN 4.7
    WHEN vc.vendor_name = 'South Spice' THEN 4.5
    WHEN vc.vendor_name = 'Burger Junction' THEN 4.3
    WHEN vc.vendor_name = 'Green Garden' THEN 4.4
  END as average_rating
FROM vendor_categories vc;