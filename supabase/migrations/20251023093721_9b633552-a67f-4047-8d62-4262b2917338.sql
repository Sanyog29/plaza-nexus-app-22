-- Drop old function first
DROP FUNCTION IF EXISTS public.update_user_role_and_department(uuid, text, text, text);

-- Create compatibility view for profiles with role
CREATE OR REPLACE VIEW profiles_with_role AS
SELECT 
  p.*,
  ur.role::text as role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;

-- Grant access to authenticated users
GRANT SELECT ON profiles_with_role TO authenticated;

-- Create function to update user role and department
CREATE OR REPLACE FUNCTION public.update_user_role_and_department(
  target_user_id uuid,
  role_text text,
  dept text DEFAULT NULL,
  spec text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  resolved_app_role app_role;
BEGIN
  -- Check caller is admin or super_admin
  SELECT ur.role::text INTO caller_role
  FROM user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'super_admin');
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only administrators can update user roles');
  END IF;
  
  -- Map role_text to app_role via invitation_roles
  SELECT ir.app_role INTO resolved_app_role
  FROM invitation_roles ir
  WHERE ir.title = role_text OR ir.slug = role_text
  LIMIT 1;
  
  -- Fallback: try direct cast if not found in invitation_roles
  IF resolved_app_role IS NULL THEN
    BEGIN
      resolved_app_role := role_text::app_role;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid role specified');
    END;
  END IF;
  
  -- Upsert into user_roles
  INSERT INTO user_roles (user_id, role)
  VALUES (target_user_id, resolved_app_role)
  ON CONFLICT (user_id, role) DO UPDATE
  SET assigned_at = now(), assigned_by = auth.uid();
  
  -- Delete any other roles for this user (one role per user)
  DELETE FROM user_roles
  WHERE user_id = target_user_id AND role != resolved_app_role;
  
  -- Update profile display fields
  UPDATE profiles
  SET 
    assigned_role_title = role_text,
    department = COALESCE(dept, department),
    specialization = COALESCE(spec, specialization),
    updated_at = now()
  WHERE id = target_user_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'User role updated successfully');
END;
$$;