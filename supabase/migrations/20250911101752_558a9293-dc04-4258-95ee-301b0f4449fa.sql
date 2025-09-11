-- Create user category enum
CREATE TYPE user_category_type AS ENUM ('tenant', 'food_vendor', 'staff', 'admin');

-- Add user_category column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_category user_category_type DEFAULT 'tenant';

-- Backfill existing users based on their role
UPDATE public.profiles 
SET user_category = CASE 
  WHEN role = 'vendor' THEN 'food_vendor'::user_category_type
  WHEN role = 'admin' THEN 'admin'::user_category_type
  WHEN role IN ('ops_supervisor', 'field_staff', 'mst', 'fe', 'hk', 'se', 'assistant_manager', 'assistant_floor_manager', 'assistant_general_manager', 'assistant_vice_president', 'vp', 'cxo', 'ceo') THEN 'staff'::user_category_type
  ELSE 'tenant'::user_category_type
END;

-- Create POS-related tables
CREATE TABLE public.pos_terminals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL,
  terminal_name TEXT NOT NULL,
  terminal_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.pos_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  terminal_id UUID REFERENCES public.pos_terminals(id),
  cashier_id UUID NOT NULL,
  shift_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  shift_end TIMESTAMP WITH TIME ZONE,
  opening_cash DECIMAL(10,2) DEFAULT 0,
  closing_cash DECIMAL(10,2),
  total_sales DECIMAL(10,2) DEFAULT 0,
  cash_collected DECIMAL(10,2) DEFAULT 0,
  card_collected DECIMAL(10,2) DEFAULT 0,
  upi_collected DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.order_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.cafeteria_orders(id),
  payment_method TEXT NOT NULL, -- 'cash', 'card', 'upi'
  amount DECIMAL(10,2) NOT NULL,
  transaction_ref TEXT,
  processed_by UUID NOT NULL,
  shift_id UUID REFERENCES public.pos_shifts(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.order_discounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.cafeteria_orders(id),
  discount_type TEXT NOT NULL, -- 'percentage', 'amount', 'coupon'
  discount_value DECIMAL(10,2) NOT NULL,
  discount_reason TEXT,
  applied_by UUID NOT NULL,
  manager_approval_pin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.order_taxes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.cafeteria_orders(id),
  tax_name TEXT NOT NULL, -- 'CGST', 'SGST', 'IGST', 'VAT'
  tax_rate DECIMAL(5,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add POS-related columns to cafeteria_orders
ALTER TABLE public.cafeteria_orders 
ADD COLUMN order_channel TEXT DEFAULT 'online',
ADD COLUMN service_type TEXT DEFAULT 'delivery',
ADD COLUMN table_number TEXT,
ADD COLUMN created_by UUID,
ADD COLUMN bill_number TEXT,
ADD COLUMN kot_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_status TEXT DEFAULT 'pending';

-- Enable RLS on new tables
ALTER TABLE public.pos_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_taxes ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is food vendor
CREATE OR REPLACE FUNCTION public.is_food_vendor(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND user_category = 'food_vendor'
  );
$$;

-- Create helper function to check if user is food vendor staff for specific vendor
CREATE OR REPLACE FUNCTION public.is_food_vendor_staff_for_vendor(user_id UUID, target_vendor_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_staff vs
    JOIN public.profiles p ON vs.user_id = p.id
    WHERE vs.user_id = $1 
    AND vs.vendor_id = $2 
    AND vs.is_active = true
    AND p.user_category = 'food_vendor'
  );
$$;

-- RLS Policies for POS tables (ALLOWLIST approach)
-- pos_terminals
CREATE POLICY "Food vendors can manage their terminals"
ON public.pos_terminals
FOR ALL
USING (is_food_vendor_staff_for_vendor(auth.uid(), vendor_id))
WITH CHECK (is_food_vendor_staff_for_vendor(auth.uid(), vendor_id));

-- pos_shifts
CREATE POLICY "Food vendor staff can manage their shifts"
ON public.pos_shifts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.pos_terminals pt
    WHERE pt.id = pos_shifts.terminal_id
    AND is_food_vendor_staff_for_vendor(auth.uid(), pt.vendor_id)
  )
  OR cashier_id = auth.uid()
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pos_terminals pt
    WHERE pt.id = pos_shifts.terminal_id
    AND is_food_vendor_staff_for_vendor(auth.uid(), pt.vendor_id)
  )
  OR cashier_id = auth.uid()
);

-- order_payments
CREATE POLICY "Food vendor staff can manage payments for their orders"
ON public.order_payments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cafeteria_orders co
    JOIN public.vendors v ON co.vendor_id = v.id
    WHERE co.id = order_payments.order_id
    AND is_food_vendor_staff_for_vendor(auth.uid(), v.id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cafeteria_orders co
    JOIN public.vendors v ON co.vendor_id = v.id
    WHERE co.id = order_payments.order_id
    AND is_food_vendor_staff_for_vendor(auth.uid(), v.id)
  )
);

-- order_discounts
CREATE POLICY "Food vendor staff can manage discounts for their orders"
ON public.order_discounts
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cafeteria_orders co
    JOIN public.vendors v ON co.vendor_id = v.id
    WHERE co.id = order_discounts.order_id
    AND is_food_vendor_staff_for_vendor(auth.uid(), v.id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cafeteria_orders co
    JOIN public.vendors v ON co.vendor_id = v.id
    WHERE co.id = order_discounts.order_id
    AND is_food_vendor_staff_for_vendor(auth.uid(), v.id)
  )
);

-- order_taxes
CREATE POLICY "Food vendor staff can manage taxes for their orders"
ON public.order_taxes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cafeteria_orders co
    JOIN public.vendors v ON co.vendor_id = v.id
    WHERE co.id = order_taxes.order_id
    AND is_food_vendor_staff_for_vendor(auth.uid(), v.id)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cafeteria_orders co
    JOIN public.vendors v ON co.vendor_id = v.id
    WHERE co.id = order_taxes.order_id
    AND is_food_vendor_staff_for_vendor(auth.uid(), v.id)
  )
);

-- Update existing cafeteria_orders RLS to include food vendor access
CREATE POLICY "Food vendor staff can manage their vendor orders"
ON public.cafeteria_orders
FOR ALL
USING (is_food_vendor_staff_for_vendor(auth.uid(), vendor_id))
WITH CHECK (is_food_vendor_staff_for_vendor(auth.uid(), vendor_id));

-- Restrictive RLS policies to DENY food vendors access to back-office tables
-- Analytics summaries - DENY food vendors
CREATE POLICY "Deny food vendors access to analytics"
ON public.analytics_summaries
FOR ALL
USING (NOT is_food_vendor(auth.uid()));

-- Performance metrics - DENY food vendors
CREATE POLICY "Deny food vendors access to performance metrics"
ON public.performance_metrics  
FOR ALL
USING (NOT is_food_vendor(auth.uid()));

-- Maintenance requests - DENY food vendors
CREATE POLICY "Deny food vendors access to maintenance requests"
ON public.maintenance_requests
FOR ALL
USING (NOT is_food_vendor(auth.uid()));

-- Assets - DENY food vendors
CREATE POLICY "Deny food vendors access to assets"
ON public.assets
FOR ALL
USING (NOT is_food_vendor(auth.uid()));

-- Security incidents - DENY food vendors
CREATE POLICY "Deny food vendors access to security incidents"
ON public.security_incidents
FOR ALL
USING (NOT is_food_vendor(auth.uid()));

-- System settings - DENY food vendors
CREATE POLICY "Deny food vendors access to system settings"
ON public.system_settings
FOR ALL
USING (NOT is_food_vendor(auth.uid()));

-- Audit logs - DENY food vendors (except their own)
CREATE POLICY "Food vendors can only see their own audit logs"
ON public.audit_logs
FOR SELECT
USING (
  CASE 
    WHEN is_food_vendor(auth.uid()) THEN user_id = auth.uid()
    ELSE NOT is_food_vendor(auth.uid())
  END
);

-- Create audit function for unauthorized access attempts
CREATE OR REPLACE FUNCTION public.log_unauthorized_access_attempt(
  attempted_table TEXT,
  attempted_action TEXT,
  user_category TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    new_values
  ) VALUES (
    auth.uid(),
    'unauthorized_access_attempt',
    'security_violation',
    jsonb_build_object(
      'attempted_table', attempted_table,
      'attempted_action', attempted_action,
      'user_category', COALESCE(user_category, (SELECT profiles.user_category FROM public.profiles WHERE id = auth.uid())),
      'timestamp', now(),
      'ip_address', current_setting('request.jwt.claims', true)::jsonb ->> 'ip'
    )
  );
END;
$$;