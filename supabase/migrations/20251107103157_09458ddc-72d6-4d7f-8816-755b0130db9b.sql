-- Phase 1: Create function to check if role is eligible to be an approver
-- Only management roles (L2+) can approve requisitions
CREATE OR REPLACE FUNCTION public.is_approver_eligible_role(check_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT check_role IN (
    'assistant_manager',
    'assistant_floor_manager',
    'assistant_general_manager',
    'assistant_vice_president',
    'vp',
    'ceo',
    'cxo',
    'admin'
  );
$$;

-- Phase 2: Create validation function for property_approvers
CREATE OR REPLACE FUNCTION public.validate_approver_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role
  SELECT role::text INTO user_role
  FROM public.user_roles
  WHERE user_id = NEW.approver_user_id
  LIMIT 1;

  -- Check if role is eligible to be an approver
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User does not have a role assigned';
  END IF;

  IF NOT public.is_approver_eligible_role(user_role) THEN
    RAISE EXCEPTION 'User with role % cannot be assigned as approver. Only management roles (assistant_manager and above) can approve requisitions.', user_role;
  END IF;

  RETURN NEW;
END;
$$;

-- Phase 3: Create trigger to enforce approver role validation
DROP TRIGGER IF EXISTS ensure_approver_is_management ON public.property_approvers;

CREATE TRIGGER ensure_approver_is_management
BEFORE INSERT OR UPDATE ON public.property_approvers
FOR EACH ROW
EXECUTE FUNCTION public.validate_approver_role();

-- Phase 4: Clean up any existing invalid approvers (operational roles)
DELETE FROM public.property_approvers
WHERE approver_user_id IN (
  SELECT user_id 
  FROM public.user_roles
  WHERE role::text IN ('fe', 'mst', 'hk', 'se', 'tenant', 'super_tenant', 'vendor', 'food_vendor', 'ops_supervisor', 'procurement_manager', 'purchase_executive', 'property_manager')
);

-- Add comment for documentation
COMMENT ON FUNCTION public.is_approver_eligible_role(text) IS 
'Checks if a role is eligible to approve requisitions. Only management roles (L2+) can be approvers: assistant_manager, assistant_floor_manager, assistant_general_manager, assistant_vice_president, vp, ceo, cxo, admin';

COMMENT ON FUNCTION public.validate_approver_role() IS 
'Trigger function that validates approver_user_id has a management role before allowing INSERT/UPDATE on property_approvers table';