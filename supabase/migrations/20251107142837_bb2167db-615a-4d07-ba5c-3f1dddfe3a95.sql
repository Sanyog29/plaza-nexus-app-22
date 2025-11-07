-- ============================================================================
-- Phase 1: Database Security Hardening for Procurement Module - Final
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add New Columns for Enhanced Security
-- ----------------------------------------------------------------------------

-- Add version column for optimistic locking to purchase_orders
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Add idempotency_key for preventing duplicate operations
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Add index for idempotency_key
CREATE UNIQUE INDEX IF NOT EXISTS purchase_orders_idempotency_key_unique 
ON public.purchase_orders(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. Add Database Constraints for Data Integrity
-- ----------------------------------------------------------------------------

-- Ensure purchase order items have positive quantities
ALTER TABLE public.purchase_order_items
DROP CONSTRAINT IF EXISTS po_items_positive_qty;

ALTER TABLE public.purchase_order_items
ADD CONSTRAINT po_items_positive_qty 
CHECK (quantity > 0);

-- Ensure purchase order items have positive unit prices
ALTER TABLE public.purchase_order_items
DROP CONSTRAINT IF EXISTS po_items_positive_unit_price;

ALTER TABLE public.purchase_order_items
ADD CONSTRAINT po_items_positive_unit_price 
CHECK (estimated_unit_price >= 0);

-- Ensure purchase order items have positive total prices
ALTER TABLE public.purchase_order_items
DROP CONSTRAINT IF EXISTS po_items_positive_total_price;

ALTER TABLE public.purchase_order_items
ADD CONSTRAINT po_items_positive_total_price 
CHECK (estimated_total_price >= 0);

-- Add composite unique constraint for property + requisition
CREATE UNIQUE INDEX IF NOT EXISTS purchase_orders_property_requisition_unique 
ON public.purchase_orders(property_id, requisition_list_id)
WHERE property_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 3. Status Transition Validation Function and Trigger
-- ----------------------------------------------------------------------------

-- Function to validate purchase order status transitions
CREATE OR REPLACE FUNCTION public.validate_po_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_status TEXT;
  new_status TEXT;
BEGIN
  old_status := OLD.status;
  new_status := NEW.status;
  
  IF OLD IS NULL THEN
    RETURN NEW;
  END IF;
  
  IF old_status = 'pending' AND new_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', old_status, new_status;
  END IF;
  
  IF old_status = 'approved' AND new_status NOT IN ('processing', 'cancelled', 'approved') THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', old_status, new_status;
  END IF;
  
  IF old_status = 'processing' AND new_status NOT IN ('completed', 'cancelled', 'processing') THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', old_status, new_status;
  END IF;
  
  IF old_status IN ('completed', 'rejected', 'cancelled') AND new_status != old_status THEN
    RAISE EXCEPTION 'Cannot change status from final state %', old_status;
  END IF;
  
  IF old_status = 'accepted' AND new_status NOT IN ('processing', 'completed', 'cancelled', 'accepted') THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', old_status, new_status;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_po_status_transition_trigger ON public.purchase_orders;

CREATE TRIGGER validate_po_status_transition_trigger
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.validate_po_status_transition();

-- ----------------------------------------------------------------------------
-- 4. Property Consistency Validation Function and Trigger
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_po_property_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requisition_property_id UUID;
BEGIN
  SELECT property_id INTO requisition_property_id
  FROM public.requisition_lists
  WHERE id = NEW.requisition_list_id;
  
  IF NEW.property_id IS NOT NULL AND requisition_property_id IS NOT NULL 
     AND NEW.property_id != requisition_property_id THEN
    RAISE EXCEPTION 'Purchase order property_id (%) does not match requisition property_id (%)', 
      NEW.property_id, requisition_property_id;
  END IF;
  
  IF NEW.property_id IS NULL AND requisition_property_id IS NOT NULL THEN
    NEW.property_id := requisition_property_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_po_property_consistency_trigger ON public.purchase_orders;

CREATE TRIGGER validate_po_property_consistency_trigger
  BEFORE INSERT OR UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_po_property_consistency();

-- ----------------------------------------------------------------------------
-- 5. Optimistic Locking Trigger
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.increment_po_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version := OLD.version + 1;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS increment_po_version_trigger ON public.purchase_orders;

CREATE TRIGGER increment_po_version_trigger
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_po_version();

-- ----------------------------------------------------------------------------
-- 6. Audit Logging for Purchase Orders
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.procurement_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  is_authorized BOOLEAN DEFAULT true,
  violation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.procurement_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS procurement_audit_logs_user_id_idx 
ON public.procurement_audit_logs(user_id);

CREATE INDEX IF NOT EXISTS procurement_audit_logs_resource_idx 
ON public.procurement_audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS procurement_audit_logs_created_at_idx 
ON public.procurement_audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION public.log_po_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  action_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'purchase_order_created';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'purchase_order_updated';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'purchase_order_deleted';
  END IF;
  
  INSERT INTO public.procurement_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    action_type,
    'purchase_order',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS log_po_changes_trigger ON public.purchase_orders;

CREATE TRIGGER log_po_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_po_changes();

CREATE OR REPLACE FUNCTION public.log_unauthorized_access(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_violation_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.procurement_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    is_authorized,
    violation_reason
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    false,
    p_violation_reason
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. Strict RLS Policies for Purchase Orders
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "purchase_orders_select_policy" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert_policy" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update_policy" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete_policy" ON public.purchase_orders;

CREATE POLICY "purchase_orders_select_policy" ON public.purchase_orders
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'procurement_manager'::app_role) OR
  has_role(auth.uid(), 'purchase_executive'::app_role) OR
  (has_role(auth.uid(), 'property_manager'::app_role) AND property_id IN (
    SELECT property_id FROM public.property_assignments WHERE user_id = auth.uid()
  )) OR
  (has_role(auth.uid(), 'staff'::app_role) AND requisition_list_id IN (
    SELECT id FROM public.requisition_lists WHERE created_by = auth.uid()
  ))
);

CREATE POLICY "purchase_orders_insert_policy" ON public.purchase_orders
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'procurement_manager'::app_role) OR
  has_role(auth.uid(), 'purchase_executive'::app_role)
);

CREATE POLICY "purchase_orders_update_policy" ON public.purchase_orders
FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'procurement_manager'::app_role) OR
  has_role(auth.uid(), 'purchase_executive'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'procurement_manager'::app_role) OR
  has_role(auth.uid(), 'purchase_executive'::app_role)
);

CREATE POLICY "purchase_orders_delete_policy" ON public.purchase_orders
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- ----------------------------------------------------------------------------
-- 8. Strict RLS Policies for Purchase Order Items
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "purchase_order_items_select_policy" ON public.purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_insert_policy" ON public.purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_update_policy" ON public.purchase_order_items;
DROP POLICY IF EXISTS "purchase_order_items_delete_policy" ON public.purchase_order_items;

CREATE POLICY "purchase_order_items_select_policy" ON public.purchase_order_items
FOR SELECT
USING (po_id IN (SELECT id FROM public.purchase_orders));

CREATE POLICY "purchase_order_items_insert_policy" ON public.purchase_order_items
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'super_admin'::app_role) OR
   has_role(auth.uid(), 'admin'::app_role) OR
   has_role(auth.uid(), 'procurement_manager'::app_role) OR
   has_role(auth.uid(), 'purchase_executive'::app_role))
  AND po_id IN (SELECT id FROM public.purchase_orders)
);

CREATE POLICY "purchase_order_items_update_policy" ON public.purchase_order_items
FOR UPDATE
USING (
  (has_role(auth.uid(), 'super_admin'::app_role) OR
   has_role(auth.uid(), 'admin'::app_role) OR
   has_role(auth.uid(), 'procurement_manager'::app_role) OR
   has_role(auth.uid(), 'purchase_executive'::app_role))
  AND po_id IN (SELECT id FROM public.purchase_orders)
)
WITH CHECK (
  (has_role(auth.uid(), 'super_admin'::app_role) OR
   has_role(auth.uid(), 'admin'::app_role) OR
   has_role(auth.uid(), 'procurement_manager'::app_role) OR
   has_role(auth.uid(), 'purchase_executive'::app_role))
  AND po_id IN (SELECT id FROM public.purchase_orders)
);

CREATE POLICY "purchase_order_items_delete_policy" ON public.purchase_order_items
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  ((has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'procurement_manager'::app_role) OR
    has_role(auth.uid(), 'purchase_executive'::app_role))
   AND po_id IN (SELECT id FROM public.purchase_orders))
);

-- ----------------------------------------------------------------------------
-- 9. RLS Policies for Procurement Audit Logs
-- ----------------------------------------------------------------------------

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'procurement_audit_logs' 
    AND policyname = 'procurement_audit_logs_select_policy'
  ) THEN
    CREATE POLICY "procurement_audit_logs_select_policy" ON public.procurement_audit_logs
    FOR SELECT
    USING (
      has_role(auth.uid(), 'super_admin'::app_role) OR
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'procurement_manager'::app_role)
    );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'procurement_audit_logs' 
    AND policyname = 'procurement_audit_logs_insert_policy'
  ) THEN
    CREATE POLICY "procurement_audit_logs_insert_policy" ON public.procurement_audit_logs
    FOR INSERT
    WITH CHECK (false);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'procurement_audit_logs' 
    AND policyname = 'procurement_audit_logs_update_policy'
  ) THEN
    CREATE POLICY "procurement_audit_logs_update_policy" ON public.procurement_audit_logs
    FOR UPDATE
    USING (false);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'procurement_audit_logs' 
    AND policyname = 'procurement_audit_logs_delete_policy'
  ) THEN
    CREATE POLICY "procurement_audit_logs_delete_policy" ON public.procurement_audit_logs
    FOR DELETE
    USING (false);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 10. Enhanced PO Number Generation Function
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_po_number_enhanced(p_property_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_code TEXT;
  year_month TEXT;
  sequence_num INTEGER;
  po_number TEXT;
BEGIN
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
  INTO property_code
  FROM public.properties
  WHERE id = p_property_id;
  
  IF property_code IS NULL OR property_code = '' THEN
    property_code := 'GEN';
  END IF;
  
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.purchase_orders
  WHERE po_number LIKE 'PO-' || property_code || '-' || year_month || '-%';
  
  po_number := 'PO-' || property_code || '-' || year_month || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN po_number;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_po_number_enhanced(UUID) TO authenticated;