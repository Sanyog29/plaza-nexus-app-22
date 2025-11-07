-- Phase 1.1: Fix RLS policies for better procurement visibility

-- Drop redundant policies
DROP POLICY IF EXISTS "Procurement staff can view approved & later requisitions" ON public.requisition_lists;
DROP POLICY IF EXISTS "Procurement can view approved requisitions" ON public.requisition_lists;

-- Create comprehensive procurement visibility policy
CREATE POLICY "Procurement can view all requisitions for tracking"
ON public.requisition_lists
FOR SELECT
TO authenticated
USING (
  is_procurement_staff(auth.uid()) OR is_admin(auth.uid())
);

COMMENT ON POLICY "Procurement can view all requisitions for tracking" ON public.requisition_lists 
IS 'Allows procurement staff to view all requisitions across all statuses for complete workflow visibility and tracking';

-- Update procurement update policy to include po_created status
DROP POLICY IF EXISTS "Procurement can update requisitions" ON public.requisition_lists;

CREATE POLICY "Procurement can update requisitions they manage"
ON public.requisition_lists
FOR UPDATE
TO authenticated
USING (
  (is_procurement_staff(auth.uid()) OR is_admin(auth.uid())) 
  AND status IN ('manager_approved', 'assigned_to_procurement', 'po_created', 'po_raised', 'in_transit', 'received')
)
WITH CHECK (
  (is_procurement_staff(auth.uid()) OR is_admin(auth.uid()))
  AND status IN ('manager_approved', 'assigned_to_procurement', 'po_created', 'po_raised', 'in_transit', 'received', 'closed')
);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_requisition_lists_status_created_at 
ON public.requisition_lists(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_requisition_lists_property_status 
ON public.requisition_lists(property_id, status);

COMMENT ON INDEX idx_requisition_lists_status_created_at 
IS 'Improves query performance for status-based filtering with date ordering';

COMMENT ON INDEX idx_requisition_lists_property_status 
IS 'Optimizes property-based requisition queries with status filtering';