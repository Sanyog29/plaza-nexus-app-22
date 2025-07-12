-- Insert vendor offers with correct discount types
INSERT INTO public.vendor_offers (vendor_id, title, description, discount_type, discount_value, minimum_order_amount, offer_code, start_date, end_date, usage_limit, is_active)
SELECT 
  v.id,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 'First Order Discount'
    WHEN v.name = 'South Spice' THEN 'Weekend Special'
  END as title,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 'Get 20% off on your first order'
    WHEN v.name = 'South Spice' THEN 'Flat ₹50 off on weekend orders'
  END as description,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 'percentage'
    WHEN v.name = 'South Spice' THEN 'fixed_amount'
  END as discount_type,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 20.00
    WHEN v.name = 'South Spice' THEN 50.00
  END as discount_value,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 200.00
    WHEN v.name = 'South Spice' THEN 150.00
  END as minimum_order_amount,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 'FIRST20'
    WHEN v.name = 'South Spice' THEN 'WEEKEND50'
  END as offer_code,
  '2024-01-01'::date as start_date,
  '2024-12-31'::date as end_date,
  CASE 
    WHEN v.name = 'Tasty Bites' THEN 100
    WHEN v.name = 'South Spice' THEN 200
  END as usage_limit,
  true as is_active
FROM vendors v
WHERE v.name IN ('Tasty Bites', 'South Spice');