-- Step 1: Clean up existing duplicate roles (keep only highest priority per user)
WITH role_priorities AS (
  SELECT unnest(ARRAY[
    'super_admin', 'admin', 'super_tenant', 'assistant_general_manager', 
    'assistant_vice_president', 'vp', 'ceo', 'cxo', 'ops_supervisor',
    'assistant_manager', 'assistant_floor_manager', 'procurement_manager',
    'purchase_executive', 'property_manager', 'fe', 'mst', 'hk', 'staff',
    'vendor', 'food_vendor', 'tenant_manager', 'tenant'
  ]) AS role,
  generate_series(100, 1, -5) AS priority
),
users_with_multiple_roles AS (
  SELECT user_id
  FROM user_roles
  GROUP BY user_id
  HAVING COUNT(*) > 1
),
roles_to_keep AS (
  SELECT DISTINCT ON (ur.user_id) ur.id
  FROM user_roles ur
  JOIN role_priorities rp ON ur.role::text = rp.role
  WHERE ur.user_id IN (SELECT user_id FROM users_with_multiple_roles)
  ORDER BY ur.user_id, rp.priority DESC
)
DELETE FROM user_roles
WHERE user_id IN (SELECT user_id FROM users_with_multiple_roles)
AND id NOT IN (SELECT id FROM roles_to_keep);

-- Step 2: Drop old function and recreate with proper parameter names
DROP FUNCTION IF EXISTS public.update_user_role(uuid, text);

CREATE FUNCTION public.update_user_role(p_user_id uuid, p_new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  resolved_app_role app_role;
BEGIN
  -- Check caller is admin or super_admin
  IF NOT public.is_admin_secure(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can update roles';
  END IF;

  -- Resolve the role
  BEGIN
    resolved_app_role := p_new_role::app_role;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid role specified: %', p_new_role;
  END;

  -- Delete ALL existing roles for this user first (enforce single role)
  DELETE FROM user_roles WHERE user_id = p_user_id;

  -- Insert the new role
  INSERT INTO public.user_roles (user_id, role, assigned_by, assigned_at)
  VALUES (p_user_id, resolved_app_role, auth.uid(), now());

  -- Update profile display field
  UPDATE profiles
  SET assigned_role_title = p_new_role, updated_at = now()
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- Step 3: Create trigger function to enforce single role per user
CREATE OR REPLACE FUNCTION public.enforce_single_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Before inserting a new role, delete any existing roles for this user
  DELETE FROM user_roles 
  WHERE user_id = NEW.user_id 
  AND id IS DISTINCT FROM NEW.id;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS before_role_insert_enforce_single ON user_roles;

CREATE TRIGGER before_role_insert_enforce_single
BEFORE INSERT ON user_roles
FOR EACH ROW EXECUTE FUNCTION public.enforce_single_role();