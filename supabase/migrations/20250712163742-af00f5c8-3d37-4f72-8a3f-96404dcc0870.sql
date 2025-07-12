-- Get vendor IDs and insert menu categories
WITH vendor_ids AS (
  SELECT id, name FROM vendors
)
INSERT INTO public.cafeteria_menu_categories (vendor_id, name, description, is_featured, display_order)
SELECT 
  v.id,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 'Main Course'
    WHEN v.name = 'South Spice' THEN 'Breakfast'
    WHEN v.name = 'Burger Junction' THEN 'Burgers'
    WHEN v.name = 'Green Garden' THEN 'Salads'
  END as name,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 'Hearty main dishes'
    WHEN v.name = 'South Spice' THEN 'Traditional breakfast items'
    WHEN v.name = 'Burger Junction' THEN 'Juicy burgers and combos'
    WHEN v.name = 'Green Garden' THEN 'Fresh and healthy salads'
  END as description,
  true as is_featured,
  1 as display_order
FROM vendor_ids v;