-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  item_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.order_items 
ADD CONSTRAINT fk_order_items_order 
FOREIGN KEY (order_id) REFERENCES public.cafeteria_orders(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for order_items
CREATE POLICY "Users can view order items for their orders" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cafeteria_orders co 
    WHERE co.id = order_items.order_id 
    AND co.user_id = auth.uid()
  )
);

CREATE POLICY "Vendor staff can view order items for their vendor orders" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.cafeteria_orders co 
    WHERE co.id = order_items.order_id 
    AND is_food_vendor_staff_for_vendor(auth.uid(), co.vendor_id)
  )
);

CREATE POLICY "Users can create order items for their orders" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cafeteria_orders co 
    WHERE co.id = order_items.order_id 
    AND co.user_id = auth.uid()
  )
);

CREATE POLICY "Vendor staff can create order items for their vendor orders" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cafeteria_orders co 
    WHERE co.id = order_items.order_id 
    AND is_food_vendor_staff_for_vendor(auth.uid(), co.vendor_id)
  )
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_items_updated_at
  BEFORE UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_items_updated_at();