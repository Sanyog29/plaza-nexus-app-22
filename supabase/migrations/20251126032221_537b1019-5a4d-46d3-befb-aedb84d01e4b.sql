-- Property-Scoped Requisition RLS Policies
-- This migration updates RLS policies to enforce property-based access control

-- Drop existing policies
DROP POLICY IF EXISTS "FE can view their own requisitions" ON requisition_lists;
DROP POLICY IF EXISTS "Managers can view property requisitions" ON requisition_lists;
DROP POLICY IF EXISTS "Property approvers can view pending requisitions" ON requisition_lists;
DROP POLICY IF EXISTS "Procurement can view approved requisitions" ON requisition_lists;
DROP POLICY IF EXISTS "Users can view their own or approved requisitions" ON requisition_lists;

-- Policy 1: FE users can ONLY see their own requisitions from their assigned properties
CREATE POLICY "FE can view their own property requisitions"
ON requisition_lists FOR SELECT
USING (
  is_field_executive(auth.uid()) 
  AND created_by = auth.uid()
  AND user_belongs_to_property(auth.uid(), property_id)
);

-- Policy 2: Managers can see ALL requisitions from properties they manage
CREATE POLICY "Managers can view property requisitions"
ON requisition_lists FOR SELECT
USING (
  is_property_manager(auth.uid()) 
  AND user_belongs_to_property(auth.uid(), property_id)
);

-- Policy 3: Property approvers can see requisitions pending approval from their assigned properties
CREATE POLICY "Property approvers can view pending requisitions"
ON requisition_lists FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM property_approvers
    WHERE approver_user_id = auth.uid()
    AND property_id = requisition_lists.property_id
    AND is_active = true
  )
  AND status IN ('pending_manager_approval', 'manager_approved', 'manager_rejected')
);

-- Policy 4: Procurement staff see all approved+ requisitions (cross-property by design)
CREATE POLICY "Procurement can view approved requisitions"
ON requisition_lists FOR SELECT
USING (
  is_procurement_staff(auth.uid())
  AND status NOT IN ('draft', 'pending_manager_approval', 'manager_rejected')
);

-- Policy 5: Admins and Super Admins can see all requisitions
CREATE POLICY "Admins can view all requisitions"
ON requisition_lists FOR SELECT
USING (
  is_admin_secure(auth.uid())
);

-- Ensure INSERT policy includes property_id validation
DROP POLICY IF EXISTS "Users can create requisitions" ON requisition_lists;
CREATE POLICY "Users can create requisitions for their properties"
ON requisition_lists FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    is_admin_secure(auth.uid()) 
    OR user_belongs_to_property(auth.uid(), property_id)
  )
);

-- Update policy for viewing requisition items (must match parent requisition access)
DROP POLICY IF EXISTS "Users can view accessible requisition items" ON requisition_list_items;
CREATE POLICY "Users can view accessible requisition items"
ON requisition_list_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM requisition_lists rl
    WHERE rl.id = requisition_list_id
    AND (
      -- FE: own requisitions from their property
      (is_field_executive(auth.uid()) AND rl.created_by = auth.uid() AND user_belongs_to_property(auth.uid(), rl.property_id))
      -- Managers: all from their properties
      OR (is_property_manager(auth.uid()) AND user_belongs_to_property(auth.uid(), rl.property_id))
      -- Property approvers: pending from their properties
      OR EXISTS (
        SELECT 1 FROM property_approvers pa
        WHERE pa.approver_user_id = auth.uid()
        AND pa.property_id = rl.property_id
        AND pa.is_active = true
        AND rl.status IN ('pending_manager_approval', 'manager_approved', 'manager_rejected')
      )
      -- Procurement: approved+
      OR (is_procurement_staff(auth.uid()) AND rl.status NOT IN ('draft', 'pending_manager_approval', 'manager_rejected'))
      -- Admins: all
      OR is_admin_secure(auth.uid())
    )
  )
);