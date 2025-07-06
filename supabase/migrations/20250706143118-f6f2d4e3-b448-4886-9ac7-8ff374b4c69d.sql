-- Clean up any old test data
DELETE FROM parking_requests WHERE visit_date < '2025-07-01';
DELETE FROM visitors WHERE visit_date < '2025-07-01';

-- Add timer functionality for visitor management
CREATE TABLE IF NOT EXISTS public.visitor_timers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  timer_type TEXT NOT NULL CHECK (timer_type IN ('entry_reminder', 'exit_reminder', 'overstay_alert')),
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on visitor_timers
ALTER TABLE public.visitor_timers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for visitor_timers
CREATE POLICY "Staff can manage visitor timers" ON public.visitor_timers
  FOR ALL USING (is_staff(auth.uid()));

-- Add updated_at trigger for visitor_timers
CREATE TRIGGER update_visitor_timers_updated_at
  BEFORE UPDATE ON public.visitor_timers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to generate QR code data
CREATE OR REPLACE FUNCTION public.generate_visitor_qr_data(visitor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  visitor_data RECORD;
  qr_data JSONB;
BEGIN
  -- Get visitor information
  SELECT v.*, vc.name as category_name, vc.icon as category_icon
  INTO visitor_data
  FROM visitors v
  LEFT JOIN visitor_categories vc ON v.category_id = vc.id
  WHERE v.id = visitor_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Visitor not found';
  END IF;
  
  -- Generate QR code data
  qr_data := jsonb_build_object(
    'visitor_id', visitor_data.id,
    'name', visitor_data.name,
    'company', visitor_data.company,
    'visit_date', visitor_data.visit_date,
    'entry_time', visitor_data.entry_time,
    'visit_purpose', visitor_data.visit_purpose,
    'approval_status', visitor_data.approval_status,
    'access_level', visitor_data.access_level,
    'category', visitor_data.category_name,
    'generated_at', now()
  );
  
  RETURN qr_data;
END;
$$;