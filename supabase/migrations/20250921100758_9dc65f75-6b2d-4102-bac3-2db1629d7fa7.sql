-- Fix vendor commission rates to 10%
UPDATE vendors 
SET commission_rate = 10.00 
WHERE commission_rate != 10.00;

-- Create function to backfill vendor analytics data
CREATE OR REPLACE FUNCTION backfill_vendor_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vendor_record RECORD;
  date_record RECORD;
BEGIN
  -- Clear existing analytics data to avoid duplicates
  DELETE FROM vendor_analytics;
  
  -- Get all active vendors
  FOR vendor_record IN SELECT id FROM vendors WHERE is_active = true LOOP
    -- Generate analytics for each day in the last 30 days
    FOR date_record IN 
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE - INTERVAL '1 day',
        INTERVAL '1 day'
      )::date as analytics_date
    LOOP
      INSERT INTO vendor_analytics (
        vendor_id, metric_date, total_orders, total_revenue, 
        average_order_value, total_items_sold, customer_satisfaction_avg
      )
      SELECT 
        vendor_record.id,
        date_record.analytics_date,
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value,
        COALESCE(SUM((
          SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = co.id
        )), 0) as total_items_sold,
        COALESCE((
          SELECT AVG(overall_rating) FROM order_feedback of WHERE of.vendor_id = vendor_record.id
          AND DATE(of.created_at) = date_record.analytics_date
        ), 0) as customer_satisfaction_avg
      FROM cafeteria_orders co
      WHERE co.vendor_id = vendor_record.id
      AND DATE(co.created_at) = date_record.analytics_date
      AND co.status = 'completed'
      GROUP BY vendor_record.id
      
      -- Handle days with no orders
      ON CONFLICT (vendor_id, metric_date) 
      DO UPDATE SET
        total_orders = EXCLUDED.total_orders,
        total_revenue = EXCLUDED.total_revenue,
        average_order_value = EXCLUDED.average_order_value,
        total_items_sold = EXCLUDED.total_items_sold,
        customer_satisfaction_avg = EXCLUDED.customer_satisfaction_avg;
    END LOOP;
  END LOOP;
END;
$$;

-- Execute backfill
SELECT backfill_vendor_analytics();

-- Set up automated daily analytics generation using pg_cron
SELECT cron.schedule(
  'daily-vendor-analytics',
  '0 1 * * *', -- Run at 1 AM daily
  $$SELECT calculate_vendor_daily_analytics()$$
);

-- Create function to get cumulative analytics
CREATE OR REPLACE FUNCTION get_vendor_cumulative_analytics(
  p_vendor_id UUID,
  p_period TEXT DEFAULT 'monthly' -- 'weekly', 'monthly', 'quarterly'
)
RETURNS TABLE(
  period_start DATE,
  period_end DATE,
  total_orders BIGINT,
  total_revenue NUMERIC,
  commission_earned NUMERIC,
  average_order_value NUMERIC,
  customer_satisfaction NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  days_back INTEGER;
  vendor_commission_rate NUMERIC;
BEGIN
  -- Get vendor commission rate
  SELECT commission_rate INTO vendor_commission_rate
  FROM vendors WHERE id = p_vendor_id;
  
  -- Determine period
  days_back := CASE p_period
    WHEN 'weekly' THEN 7
    WHEN 'monthly' THEN 30
    WHEN 'quarterly' THEN 90
    ELSE 30
  END;
  
  RETURN QUERY
  SELECT 
    (CURRENT_DATE - (days_back || ' days')::INTERVAL)::DATE as period_start,
    CURRENT_DATE::DATE as period_end,
    SUM(va.total_orders) as total_orders,
    SUM(va.total_revenue) as total_revenue,
    (SUM(va.total_revenue) * vendor_commission_rate / 100) as commission_earned,
    CASE 
      WHEN SUM(va.total_orders) > 0 
      THEN SUM(va.total_revenue) / SUM(va.total_orders)
      ELSE 0
    END as average_order_value,
    AVG(va.customer_satisfaction_avg) as customer_satisfaction
  FROM vendor_analytics va
  WHERE va.vendor_id = p_vendor_id
  AND va.metric_date >= CURRENT_DATE - (days_back || ' days')::INTERVAL
  AND va.metric_date <= CURRENT_DATE;
END;
$$;