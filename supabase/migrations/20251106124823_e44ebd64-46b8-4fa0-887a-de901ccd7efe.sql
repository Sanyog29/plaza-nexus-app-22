-- Phase 1: Add columns to requisition_items_master for POS system
ALTER TABLE public.requisition_items_master
ADD COLUMN IF NOT EXISTS item_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS max_order_limit INTEGER,
ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS unit_of_measurement TEXT DEFAULT 'Nos';

-- Add index for item_code lookups
CREATE INDEX IF NOT EXISTS idx_requisition_items_item_code ON public.requisition_items_master(item_code);

-- Create requisition_limit_tracking table for period-based limit tracking
CREATE TABLE IF NOT EXISTS public.requisition_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.requisition_items_master(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_ordered INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_item_property_period UNIQUE(item_id, property_id, period_start)
);

-- Add indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_limit_tracking_item ON public.requisition_limit_tracking(item_id);
CREATE INDEX IF NOT EXISTS idx_limit_tracking_property ON public.requisition_limit_tracking(property_id);
CREATE INDEX IF NOT EXISTS idx_limit_tracking_period ON public.requisition_limit_tracking(period_start, period_end);

-- Enable RLS on requisition_limit_tracking
ALTER TABLE public.requisition_limit_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view limits for their property
CREATE POLICY "Users can view limits for their property"
  ON public.requisition_limit_tracking FOR SELECT
  USING (
    property_id IN (
      SELECT property_id FROM public.property_assignments 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Procurement staff and super admins can insert/update limit tracking
CREATE POLICY "Procurement staff can manage limits"
  ON public.requisition_limit_tracking FOR INSERT
  WITH CHECK (
    public.is_procurement_staff(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY "Procurement staff can update limits"
  ON public.requisition_limit_tracking FOR UPDATE
  USING (
    public.is_procurement_staff(auth.uid()) 
    OR public.is_super_admin(auth.uid())
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_requisition_limit_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_requisition_limit_tracking_updated_at
  BEFORE UPDATE ON public.requisition_limit_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_requisition_limit_tracking_updated_at();

-- Function to get item limit status
CREATE OR REPLACE FUNCTION public.get_item_limit_status(
  p_item_id UUID,
  p_property_id UUID,
  p_period_start DATE DEFAULT CURRENT_DATE,
  p_period_end DATE DEFAULT (CURRENT_DATE + INTERVAL '1 month')
)
RETURNS JSONB AS $$
DECLARE
  v_max_limit INTEGER;
  v_total_ordered INTEGER;
  v_remaining INTEGER;
  v_percentage NUMERIC;
  v_status TEXT;
  v_can_order BOOLEAN;
BEGIN
  -- Get max limit from item master
  SELECT max_order_limit INTO v_max_limit
  FROM public.requisition_items_master
  WHERE id = p_item_id;
  
  -- If no limit set, return unlimited status
  IF v_max_limit IS NULL THEN
    RETURN jsonb_build_object(
      'has_limit', false,
      'can_order', true,
      'status', 'unlimited'
    );
  END IF;
  
  -- Get total ordered for the period
  SELECT COALESCE(total_ordered, 0) INTO v_total_ordered
  FROM public.requisition_limit_tracking
  WHERE item_id = p_item_id
    AND property_id = p_property_id
    AND period_start = p_period_start
    AND period_end = p_period_end;
  
  -- Calculate remaining and percentage
  v_remaining := v_max_limit - COALESCE(v_total_ordered, 0);
  v_percentage := (COALESCE(v_total_ordered, 0)::NUMERIC / v_max_limit::NUMERIC) * 100;
  
  -- Determine status based on percentage
  IF v_percentage >= 100 THEN
    v_status := 'exceeded';
    v_can_order := false;
  ELSIF v_percentage >= 90 THEN
    v_status := 'critical';
    v_can_order := true;
  ELSIF v_percentage >= 70 THEN
    v_status := 'warning';
    v_can_order := true;
  ELSE
    v_status := 'normal';
    v_can_order := true;
  END IF;
  
  RETURN jsonb_build_object(
    'has_limit', true,
    'max_limit', v_max_limit,
    'total_ordered', COALESCE(v_total_ordered, 0),
    'remaining', v_remaining,
    'percentage', ROUND(v_percentage, 2),
    'status', v_status,
    'can_order', v_can_order
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;