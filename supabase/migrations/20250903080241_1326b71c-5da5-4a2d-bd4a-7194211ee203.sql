-- Fix ambiguous parameter names in existing functions
CREATE OR REPLACE FUNCTION public.role_requires_department(user_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT user_role IN ('mst', 'fe', 'hk', 'se', 'assistant_manager', 'assistant_floor_manager', 
                       'assistant_general_manager', 'assistant_vice_president', 'ops_supervisor');
$$;

-- Standardize error handling in functions with better parameter naming
CREATE OR REPLACE FUNCTION public.admin_create_user_with_validation(
  p_email text,
  p_mobile_number text,
  p_first_name text,
  p_last_name text,
  p_role text,
  p_department text DEFAULT NULL,
  p_specialization text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_emp_id text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_resolved_role app_role;
  v_role_title text;
  v_requires_dept boolean := false;
  v_requires_spec boolean := false;
  v_invitation_id uuid;
BEGIN
  -- Validate caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Access denied: Only administrators can create users',
      'error_code', 'INSUFFICIENT_PERMISSIONS'
    );
  END IF;

  -- Validate required fields
  IF (p_email IS NULL OR p_email = '') AND (p_mobile_number IS NULL OR p_mobile_number = '') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Either email or mobile number is required',
      'error_code', 'MISSING_REQUIRED_FIELD'
    );
  END IF;

  -- Resolve role from invitation_roles
  SELECT ir.app_role, ir.title, ir.requires_specialization
    INTO v_resolved_role, v_role_title, v_requires_spec
  FROM invitation_roles ir
  WHERE (ir.title = p_role OR ir.slug = p_role OR ir.app_role::text = lower(p_role))
    AND ir.is_active = true
  LIMIT 1;

  -- Fallback to direct role casting
  IF v_resolved_role IS NULL THEN
    BEGIN
      v_resolved_role := lower(p_role)::app_role;
      v_role_title := p_role;
    EXCEPTION WHEN OTHERS THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Invalid role: %s', p_role),
        'error_code', 'INVALID_ROLE'
      );
    END;
  END IF;

  -- Check department requirement
  SELECT role_requires_department(v_resolved_role) INTO v_requires_dept;

  IF v_requires_dept AND (p_department IS NULL OR p_department = '') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Department is required for this role',
      'error_code', 'DEPARTMENT_REQUIRED'
    );
  END IF;

  IF v_requires_spec AND (p_specialization IS NULL OR p_specialization = '') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Specialization is required for this role',
      'error_code', 'SPECIALIZATION_REQUIRED'
    );
  END IF;

  -- Create user invitation
  INSERT INTO user_invitations (
    email, mobile_number, first_name, last_name, role,
    department, specialization, password, emp_id, invited_by
  ) VALUES (
    NULLIF(p_email, ''), NULLIF(p_mobile_number, ''), p_first_name, p_last_name, v_resolved_role::text,
    CASE WHEN v_requires_dept THEN p_department ELSE NULL END,
    CASE WHEN v_requires_spec THEN p_specialization ELSE NULL END,
    p_password, p_emp_id, auth.uid()
  ) RETURNING id INTO v_invitation_id;

  -- Log the action
  PERFORM log_audit_event(
    'create_user_invitation',
    'user_invitation',
    v_invitation_id,
    NULL,
    jsonb_build_object(
      'email', p_email,
      'role', v_resolved_role,
      'department', p_department,
      'created_by', auth.uid()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User invitation created successfully',
    'invitation_id', v_invitation_id
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;