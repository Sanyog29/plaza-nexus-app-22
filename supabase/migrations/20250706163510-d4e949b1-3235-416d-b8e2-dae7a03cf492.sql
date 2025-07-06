-- Phase 3: Analytics & Utility Management

-- Create utility types enum
CREATE TYPE public.utility_type AS ENUM ('electricity', 'water', 'gas', 'internet', 'hvac', 'waste_management');

-- Create utility meters table
CREATE TABLE IF NOT EXISTS public.utility_meters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_number TEXT NOT NULL UNIQUE,
  utility_type public.utility_type NOT NULL,
  location TEXT NOT NULL,
  floor TEXT NOT NULL,
  zone TEXT,
  installation_date DATE,
  last_reading_date DATE,
  last_reading_value DECIMAL(10,2),
  unit_of_measurement TEXT NOT NULL, -- kWh, liters, cubic meters, etc.
  meter_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
  supplier_name TEXT,
  contract_number TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  monthly_budget DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create utility readings table
CREATE TABLE IF NOT EXISTS public.utility_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id UUID NOT NULL REFERENCES public.utility_meters(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  reading_value DECIMAL(10,2) NOT NULL,
  consumption DECIMAL(10,2), -- Calculated consumption since last reading
  cost_per_unit DECIMAL(10,4),
  total_cost DECIMAL(10,2),
  recorded_by UUID REFERENCES public.profiles(id),
  reading_method TEXT DEFAULT 'manual', -- 'manual', 'automatic', 'estimated'
  photo_url TEXT, -- Photo of meter reading
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics summary table
CREATE TABLE IF NOT EXISTS public.analytics_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_date DATE NOT NULL,
  summary_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  metric_category TEXT NOT NULL, -- 'maintenance', 'utilities', 'staff_performance'
  metric_data JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(summary_date, summary_type, metric_category)
);

-- Create cost centers table
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department TEXT,
  budget_annual DECIMAL(12,2),
  budget_monthly DECIMAL(10,2),
  manager_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget allocations table
CREATE TABLE IF NOT EXISTS public.budget_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cost_center_id UUID NOT NULL REFERENCES public.cost_centers(id) ON DELETE CASCADE,
  allocation_month DATE NOT NULL, -- First day of month
  category TEXT NOT NULL, -- 'maintenance', 'utilities', 'supplies', 'services'
  allocated_amount DECIMAL(10,2) NOT NULL,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cost_center_id, allocation_month, category)
);

-- Enable RLS
ALTER TABLE public.utility_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for utility meters
CREATE POLICY "Staff can view all utility meters" ON public.utility_meters FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Supervisors can manage utility meters" ON public.utility_meters FOR ALL USING (is_admin(auth.uid()) OR (
  SELECT role FROM public.profiles WHERE id = auth.uid()
) IN ('ops_l2', 'admin'));

-- RLS Policies for utility readings
CREATE POLICY "Staff can view utility readings" ON public.utility_readings FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can create utility readings" ON public.utility_readings FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Supervisors can manage utility readings" ON public.utility_readings FOR ALL USING (is_admin(auth.uid()) OR (
  SELECT role FROM public.profiles WHERE id = auth.uid()
) IN ('ops_l2', 'admin'));

-- RLS Policies for analytics summaries
CREATE POLICY "Staff can view analytics summaries" ON public.analytics_summaries FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage analytics summaries" ON public.analytics_summaries FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for cost centers
CREATE POLICY "Staff can view cost centers" ON public.cost_centers FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage cost centers" ON public.cost_centers FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for budget allocations
CREATE POLICY "Staff can view budget allocations" ON public.budget_allocations FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage budget allocations" ON public.budget_allocations FOR ALL USING (is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_utility_meters_updated_at BEFORE UPDATE ON public.utility_meters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_utility_readings_updated_at BEFORE UPDATE ON public.utility_readings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cost_centers_updated_at BEFORE UPDATE ON public.cost_centers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budget_allocations_updated_at BEFORE UPDATE ON public.budget_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample utility meters
INSERT INTO public.utility_meters (meter_number, utility_type, location, floor, unit_of_measurement, supplier_name, monthly_budget) VALUES
('ELE001', 'electricity', 'Main Building', 'basement', 'kWh', 'PowerCorp Ltd', 15000.00),
('WAT001', 'water', 'Main Building', 'basement', 'liters', 'AquaSupply Co', 3000.00),
('GAS001', 'gas', 'Cafeteria Kitchen', 'ground', 'cubic_meters', 'GasFlow Inc', 2500.00),
('INT001', 'internet', 'IT Room', '1', 'GB', 'NetConnect Pro', 5000.00),
('HVAC001', 'hvac', 'Central HVAC', 'basement', 'operating_hours', 'ClimateControl', 8000.00);

-- Insert sample cost centers
INSERT INTO public.cost_centers (name, code, department, budget_annual, budget_monthly) VALUES
('Facilities Management', 'FM001', 'Operations', 500000.00, 41666.67),
('IT Infrastructure', 'IT001', 'Technology', 300000.00, 25000.00),
('Cafeteria Operations', 'CAF001', 'Services', 200000.00, 16666.67),
('Security Department', 'SEC001', 'Security', 150000.00, 12500.00);

-- Function to calculate utility consumption and costs
CREATE OR REPLACE FUNCTION public.calculate_utility_consumption()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  reading_record RECORD;
  previous_reading RECORD;
  consumption_value DECIMAL(10,2);
BEGIN
  -- Process each new reading that doesn't have consumption calculated
  FOR reading_record IN 
    SELECT * FROM public.utility_readings 
    WHERE consumption IS NULL
    ORDER BY meter_id, reading_date
  LOOP
    -- Get the previous reading for the same meter
    SELECT * INTO previous_reading
    FROM public.utility_readings
    WHERE meter_id = reading_record.meter_id 
    AND reading_date < reading_record.reading_date
    ORDER BY reading_date DESC
    LIMIT 1;
    
    -- Calculate consumption if previous reading exists
    IF FOUND THEN
      consumption_value := reading_record.reading_value - previous_reading.reading_value;
      
      -- Update the reading with calculated consumption and cost
      UPDATE public.utility_readings
      SET consumption = consumption_value,
          total_cost = CASE 
            WHEN cost_per_unit IS NOT NULL THEN consumption_value * cost_per_unit
            ELSE NULL
          END,
          updated_at = now()
      WHERE id = reading_record.id;
    ELSE
      -- First reading for this meter, set consumption to 0
      UPDATE public.utility_readings
      SET consumption = 0,
          total_cost = 0,
          updated_at = now()
      WHERE id = reading_record.id;
    END IF;
    
    -- Update meter's last reading info
    UPDATE public.utility_meters
    SET last_reading_date = reading_record.reading_date,
        last_reading_value = reading_record.reading_value,
        updated_at = now()
    WHERE id = reading_record.meter_id;
  END LOOP;
END;
$$;

-- Function to generate analytics summaries
CREATE OR REPLACE FUNCTION public.generate_analytics_summary(summary_date DATE, summary_type TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  maintenance_metrics JSONB;
  utility_metrics JSONB;
  staff_metrics JSONB;
BEGIN
  -- Calculate maintenance metrics
  SELECT jsonb_build_object(
    'total_requests', COUNT(*),
    'completed_requests', COUNT(*) FILTER (WHERE status = 'completed'),
    'avg_completion_hours', COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/3600) FILTER (WHERE status = 'completed'), 0),
    'sla_breaches', COUNT(*) FILTER (WHERE sla_breach_at < completed_at OR (sla_breach_at < now() AND status != 'completed')),
    'priority_breakdown', jsonb_build_object(
      'urgent', COUNT(*) FILTER (WHERE priority = 'urgent'),
      'high', COUNT(*) FILTER (WHERE priority = 'high'),
      'medium', COUNT(*) FILTER (WHERE priority = 'medium'),
      'low', COUNT(*) FILTER (WHERE priority = 'low')
    )
  ) INTO maintenance_metrics
  FROM maintenance_requests
  WHERE created_at::DATE = summary_date;
  
  -- Calculate utility metrics
  SELECT jsonb_build_object(
    'total_consumption', COALESCE(SUM(consumption), 0),
    'total_cost', COALESCE(SUM(total_cost), 0),
    'readings_count', COUNT(*),
    'by_utility_type', (
      SELECT jsonb_object_agg(utility_type, utility_data)
      FROM (
        SELECT 
          um.utility_type,
          jsonb_build_object(
            'consumption', COALESCE(SUM(ur.consumption), 0),
            'cost', COALESCE(SUM(ur.total_cost), 0),
            'readings', COUNT(ur.*)
          ) as utility_data
        FROM utility_meters um
        LEFT JOIN utility_readings ur ON um.id = ur.meter_id AND ur.reading_date = summary_date
        GROUP BY um.utility_type
      ) utility_summary
    )
  ) INTO utility_metrics
  FROM utility_readings ur
  JOIN utility_meters um ON ur.meter_id = um.id
  WHERE ur.reading_date = summary_date;
  
  -- Calculate staff performance metrics
  SELECT jsonb_build_object(
    'active_staff', COUNT(DISTINCT staff_id),
    'total_attendance_hours', COALESCE(SUM(EXTRACT(EPOCH FROM (check_out_time - check_in_time))/3600) FILTER (WHERE check_out_time IS NOT NULL), 0),
    'completed_checklists', (SELECT COUNT(*) FROM daily_checklists WHERE created_at::DATE = summary_date AND completion_status = 'completed'),
    'completed_tasks', (SELECT COUNT(*) FROM task_assignments WHERE actual_completion::DATE = summary_date)
  ) INTO staff_metrics
  FROM staff_attendance
  WHERE check_in_time::DATE = summary_date;
  
  -- Insert or update summaries
  INSERT INTO analytics_summaries (summary_date, summary_type, metric_category, metric_data)
  VALUES 
    (summary_date, summary_type, 'maintenance', maintenance_metrics),
    (summary_date, summary_type, 'utilities', utility_metrics),
    (summary_date, summary_type, 'staff_performance', staff_metrics)
  ON CONFLICT (summary_date, summary_type, metric_category)
  DO UPDATE SET 
    metric_data = EXCLUDED.metric_data,
    calculated_at = now();
END;
$$;