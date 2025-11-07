-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  requisition_list_id UUID NOT NULL REFERENCES public.requisition_lists(id) ON DELETE RESTRICT,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('draft', 'accepted', 'processing', 'completed', 'cancelled')),
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  accepted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  expected_delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  requisition_list_item_id UUID REFERENCES public.requisition_list_items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  estimated_unit_price NUMERIC(10, 2),
  estimated_total_price NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_purchase_orders_requisition ON public.purchase_orders(requisition_list_id);
CREATE INDEX idx_purchase_orders_property ON public.purchase_orders(property_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_orders_accepted_by ON public.purchase_orders(accepted_by);
CREATE INDEX idx_purchase_order_items_po ON public.purchase_order_items(po_id);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_orders
CREATE POLICY "Procurement staff can view all purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (public.is_procurement_staff(auth.uid()));

CREATE POLICY "Procurement staff can create purchase orders"
  ON public.purchase_orders FOR INSERT
  WITH CHECK (public.is_procurement_staff(auth.uid()));

CREATE POLICY "Procurement staff can update purchase orders"
  ON public.purchase_orders FOR UPDATE
  USING (public.is_procurement_staff(auth.uid()));

CREATE POLICY "Admins can view all purchase orders"
  ON public.purchase_orders FOR SELECT
  USING (public.is_admin_secure(auth.uid()));

CREATE POLICY "Property managers can view their property POs"
  ON public.purchase_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.property_assignments pa
      WHERE pa.user_id = auth.uid()
        AND pa.property_id = purchase_orders.property_id
    )
  );

-- RLS Policies for purchase_order_items
CREATE POLICY "Procurement staff can view all PO items"
  ON public.purchase_order_items FOR SELECT
  USING (public.is_procurement_staff(auth.uid()));

CREATE POLICY "Procurement staff can create PO items"
  ON public.purchase_order_items FOR INSERT
  WITH CHECK (public.is_procurement_staff(auth.uid()));

CREATE POLICY "Admins can view all PO items"
  ON public.purchase_order_items FOR SELECT
  USING (public.is_admin_secure(auth.uid()));

CREATE POLICY "Property managers can view their property PO items"
  ON public.purchase_order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.purchase_orders po
      JOIN public.property_assignments pa ON pa.property_id = po.property_id
      WHERE po.id = purchase_order_items.po_id
        AND pa.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add new status to requisition_lists if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'requisition_status' AND e.enumlabel = 'po_created'
  ) THEN
    ALTER TYPE public.requisition_status ADD VALUE 'po_created';
  END IF;
END $$;