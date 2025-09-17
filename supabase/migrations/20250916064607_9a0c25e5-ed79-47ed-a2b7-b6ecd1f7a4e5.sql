-- Create vendor_menu_schedules table for date-based menu management
CREATE TABLE public.vendor_menu_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  menu_item_id UUID NOT NULL REFERENCES public.vendor_menu_items(id) ON DELETE CASCADE,
  availability_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  schedule_type TEXT NOT NULL DEFAULT 'daily' CHECK (schedule_type IN ('daily', 'weekly', 'date_range', 'specific')),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add import_batch_id to vendor_menu_items for tracking imports
ALTER TABLE public.vendor_menu_items 
ADD COLUMN import_batch_id UUID;

-- Create import_batches table for tracking import sessions
CREATE TABLE public.import_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  filename TEXT NOT NULL,
  total_items INTEGER NOT NULL DEFAULT 0,
  successful_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'rolled_back')),
  error_summary JSONB DEFAULT '[]'::jsonb,
  success_summary JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on new tables
ALTER TABLE public.vendor_menu_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_menu_schedules
CREATE POLICY "Vendor staff can manage their vendor schedules" 
ON public.vendor_menu_schedules 
FOR ALL 
USING (is_vendor_staff_for_vendor(auth.uid(), vendor_id))
WITH CHECK (is_vendor_staff_for_vendor(auth.uid(), vendor_id));

CREATE POLICY "Anyone can view active schedules" 
ON public.vendor_menu_schedules 
FOR SELECT 
USING (is_active = true);

-- RLS policies for import_batches
CREATE POLICY "Vendor staff can view their vendor import batches" 
ON public.import_batches 
FOR SELECT 
USING (is_vendor_staff_for_vendor(auth.uid(), vendor_id));

CREATE POLICY "Vendor staff can create import batches for their vendor" 
ON public.import_batches 
FOR INSERT 
WITH CHECK (is_vendor_staff_for_vendor(auth.uid(), vendor_id));

CREATE POLICY "Vendor staff can update their vendor import batches" 
ON public.import_batches 
FOR UPDATE 
USING (is_vendor_staff_for_vendor(auth.uid(), vendor_id))
WITH CHECK (is_vendor_staff_for_vendor(auth.uid(), vendor_id));

-- Add indexes for performance
CREATE INDEX idx_vendor_menu_schedules_vendor_date ON public.vendor_menu_schedules(vendor_id, availability_date);
CREATE INDEX idx_vendor_menu_schedules_item_active ON public.vendor_menu_schedules(menu_item_id, is_active);
CREATE INDEX idx_import_batches_vendor ON public.import_batches(vendor_id, created_at DESC);

-- Update trigger for vendor_menu_schedules
CREATE TRIGGER update_vendor_menu_schedules_updated_at
  BEFORE UPDATE ON public.vendor_menu_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_items_updated_at();