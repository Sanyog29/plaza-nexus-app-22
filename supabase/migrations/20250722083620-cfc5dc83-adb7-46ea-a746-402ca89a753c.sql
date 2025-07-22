
-- Add missing columns to vendor_menu_items for enhanced functionality
ALTER TABLE vendor_menu_items 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER,
ADD COLUMN IF NOT EXISTS nutritional_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ingredients TEXT[],
ADD COLUMN IF NOT EXISTS allergens TEXT[],
ADD COLUMN IF NOT EXISTS spice_level INTEGER CHECK (spice_level >= 0 AND spice_level <= 5),
ADD COLUMN IF NOT EXISTS availability_schedule JSONB DEFAULT '{}';

-- Create menu item images table
CREATE TABLE IF NOT EXISTS vendor_menu_item_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES vendor_menu_items(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vendor analytics data table
CREATE TABLE IF NOT EXISTS vendor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  average_order_value DECIMAL(10,2) DEFAULT 0,
  total_items_sold INTEGER DEFAULT 0,
  customer_satisfaction_avg DECIMAL(3,2) DEFAULT 0,
  peak_hour_start INTEGER DEFAULT 12,
  peak_hour_end INTEGER DEFAULT 14,
  popular_items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(vendor_id, metric_date)
);

-- Create vendor performance metrics table
CREATE TABLE IF NOT EXISTS vendor_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  order_fulfillment_rate DECIMAL(5,2) DEFAULT 0,
  average_preparation_time DECIMAL(8,2) DEFAULT 0,
  order_accuracy_rate DECIMAL(5,2) DEFAULT 0,
  customer_return_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(vendor_id, metric_date)
);

-- Create order timeline table for detailed tracking
CREATE TABLE IF NOT EXISTS order_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES cafeteria_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies for new tables
ALTER TABLE vendor_menu_item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;

-- Policies for vendor_menu_item_images
CREATE POLICY "Vendor staff can manage their menu item images" ON vendor_menu_item_images
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM vendor_menu_items vmi
    JOIN vendor_staff vs ON vmi.vendor_id = vs.vendor_id
    WHERE vmi.id = vendor_menu_item_images.menu_item_id
    AND vs.user_id = auth.uid()
    AND vs.is_active = true
  )
);

CREATE POLICY "Anyone can view menu item images" ON vendor_menu_item_images
FOR SELECT USING (true);

-- Policies for vendor_analytics
CREATE POLICY "Vendor staff can view their analytics" ON vendor_analytics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM vendor_staff vs
    WHERE vs.vendor_id = vendor_analytics.vendor_id
    AND vs.user_id = auth.uid()
    AND vs.is_active = true
  ) OR is_admin(auth.uid())
);

-- Policies for vendor_performance_metrics
CREATE POLICY "Vendor staff can view their performance metrics" ON vendor_performance_metrics
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM vendor_staff vs
    WHERE vs.vendor_id = vendor_performance_metrics.vendor_id
    AND vs.user_id = auth.uid()
    AND vs.is_active = true
  ) OR is_admin(auth.uid())
);

-- Policies for order_timeline
CREATE POLICY "Vendor staff can view order timeline for their orders" ON order_timeline
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM cafeteria_orders co
    JOIN vendor_staff vs ON co.vendor_id = vs.vendor_id
    WHERE co.id = order_timeline.order_id
    AND vs.user_id = auth.uid()
    AND vs.is_active = true
  ) OR is_admin(auth.uid())
);

CREATE POLICY "Vendor staff can insert order timeline for their orders" ON order_timeline
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM cafeteria_orders co
    JOIN vendor_staff vs ON co.vendor_id = vs.vendor_id
    WHERE co.id = order_timeline.order_id
    AND vs.user_id = auth.uid()
    AND vs.is_active = true
  )
);

-- Function to calculate daily vendor analytics
CREATE OR REPLACE FUNCTION calculate_vendor_daily_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vendor_record RECORD;
  analytics_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  FOR vendor_record IN SELECT id FROM vendors WHERE is_active = true LOOP
    INSERT INTO vendor_analytics (
      vendor_id, metric_date, total_orders, total_revenue, 
      average_order_value, total_items_sold, customer_satisfaction_avg
    )
    SELECT 
      vendor_record.id,
      analytics_date,
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as average_order_value,
      COALESCE(SUM((
        SELECT SUM(quantity) FROM order_items oi WHERE oi.order_id = co.id
      )), 0) as total_items_sold,
      COALESCE((
        SELECT AVG(overall_rating) FROM order_feedback of WHERE of.vendor_id = vendor_record.id
        AND DATE(of.created_at) = analytics_date
      ), 0) as customer_satisfaction_avg
    FROM cafeteria_orders co
    WHERE co.vendor_id = vendor_record.id
    AND DATE(co.created_at) = analytics_date
    AND co.status = 'completed'
    GROUP BY vendor_record.id
    ON CONFLICT (vendor_id, metric_date) 
    DO UPDATE SET
      total_orders = EXCLUDED.total_orders,
      total_revenue = EXCLUDED.total_revenue,
      average_order_value = EXCLUDED.average_order_value,
      total_items_sold = EXCLUDED.total_items_sold,
      customer_satisfaction_avg = EXCLUDED.customer_satisfaction_avg;
  END LOOP;
END;
$$;

-- Insert sample data
INSERT INTO vendor_menu_item_images (menu_item_id, image_url, is_primary)
SELECT id, 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9', true
FROM vendor_menu_items 
WHERE image_url IS NULL 
LIMIT 5;

-- Update existing menu items with enhanced data
UPDATE vendor_menu_items SET 
  stock_quantity = 50,
  low_stock_threshold = 10,
  cost_price = price * 0.6,
  profit_margin = 40,
  preparation_time_minutes = 15,
  nutritional_info = '{"calories": 250, "protein": 12, "carbs": 30, "fat": 8}',
  spice_level = 2
WHERE stock_quantity IS NULL;
