-- =====================================================
-- Phase 1: Multi-Location Procurement Architecture
-- Idempotency Keys + Super Admin Audit Logging
-- =====================================================

-- Add idempotency_key to requisition_lists
ALTER TABLE public.requisition_lists 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Add idempotency_key to purchase_orders
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;

-- Create index on requisition_lists idempotency_key for fast lookup
CREATE INDEX IF NOT EXISTS idx_requisition_lists_idempotency_key 
ON public.requisition_lists(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Create index on purchase_orders idempotency_key for fast lookup
CREATE INDEX IF NOT EXISTS idx_purchase_orders_idempotency_key 
ON public.purchase_orders(idempotency_key) 
WHERE idempotency_key IS NOT NULL;

-- Create super_admin_audit_log table
CREATE TABLE IF NOT EXISTS public.super_admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  accessed_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on super_admin_audit_log
ALTER TABLE public.super_admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view all audit logs"
ON public.super_admin_audit_log
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- System can insert audit logs (SECURITY DEFINER functions)
CREATE POLICY "System can insert audit logs"
ON public.super_admin_audit_log
FOR INSERT
WITH CHECK (true);

-- Create indexes on super_admin_audit_log for performance
CREATE INDEX IF NOT EXISTS idx_super_admin_audit_log_admin_user_id 
ON public.super_admin_audit_log(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_super_admin_audit_log_created_at 
ON public.super_admin_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_super_admin_audit_log_property_id 
ON public.super_admin_audit_log(property_id) 
WHERE property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_super_admin_audit_log_accessed_property_id 
ON public.super_admin_audit_log(accessed_property_id) 
WHERE accessed_property_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_super_admin_audit_log_resource_type 
ON public.super_admin_audit_log(resource_type);

-- Create function to log super admin access
CREATE OR REPLACE FUNCTION public.log_super_admin_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  is_admin BOOLEAN;
  action_type TEXT;
  property_id_value UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if current user is super admin
  is_admin := public.is_super_admin(current_user_id);
  
  -- Only log if user is super admin
  IF is_admin THEN
    -- Determine action type
    action_type := CASE TG_OP
      WHEN 'INSERT' THEN 'super_admin_insert'
      WHEN 'UPDATE' THEN 'super_admin_update'
      WHEN 'DELETE' THEN 'super_admin_delete'
      ELSE 'super_admin_select'
    END;
    
    -- Extract property_id from the record
    property_id_value := CASE
      WHEN TG_OP = 'DELETE' THEN OLD.property_id
      ELSE NEW.property_id
    END;
    
    -- Insert audit log
    INSERT INTO public.super_admin_audit_log (
      admin_user_id,
      action,
      resource_type,
      resource_id,
      accessed_property_id,
      old_values,
      new_values,
      metadata
    ) VALUES (
      current_user_id,
      action_type,
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
      END,
      property_id_value,
      CASE 
        WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD)
        ELSE NULL
      END,
      CASE 
        WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW)
        ELSE NULL
      END,
      jsonb_build_object(
        'table', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for super admin audit logging on critical tables
DROP TRIGGER IF EXISTS trigger_super_admin_audit_requisition_lists ON public.requisition_lists;
CREATE TRIGGER trigger_super_admin_audit_requisition_lists
AFTER INSERT OR UPDATE OR DELETE ON public.requisition_lists
FOR EACH ROW
EXECUTE FUNCTION public.log_super_admin_access();

DROP TRIGGER IF EXISTS trigger_super_admin_audit_purchase_orders ON public.purchase_orders;
CREATE TRIGGER trigger_super_admin_audit_purchase_orders
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.log_super_admin_access();

DROP TRIGGER IF EXISTS trigger_super_admin_audit_vendor_profiles ON public.vendor_profiles;
CREATE TRIGGER trigger_super_admin_audit_vendor_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.vendor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.log_super_admin_access();

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_requisition_lists_property_status 
ON public.requisition_lists(property_id, status);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_property_status 
ON public.purchase_orders(property_id, status);

-- Add comments for documentation
COMMENT ON COLUMN public.requisition_lists.idempotency_key IS 
'Unique key to prevent duplicate requisition creation. Format: REQ-{property_code}-{timestamp}-{random}';

COMMENT ON COLUMN public.purchase_orders.idempotency_key IS 
'Unique key to prevent duplicate PO creation. Format: PO-{property_code}-{timestamp}-{random}';

COMMENT ON TABLE public.super_admin_audit_log IS 
'Audit log for all super admin actions across all properties. Tracks cross-location access for compliance and security monitoring.';

COMMENT ON FUNCTION public.log_super_admin_access() IS 
'Automatically logs all super admin INSERT, UPDATE, DELETE operations on critical procurement tables for audit trail and compliance.';