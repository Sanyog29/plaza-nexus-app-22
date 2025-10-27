-- Update admin_create_user_invitation to accept and validate property_id
-- (Note: The overload with property_id already exists in the function list, so we'll ensure it's used)

-- Update admin_bulk_create_users to handle property_code and property_id
CREATE OR REPLACE FUNCTION public.admin_bulk_create_users(
  users_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record JSONB;
  success_count INTEGER := 0;
  error_count INTEGER := 0;
  success_results JSONB := '[]'::jsonb;
  error_results JSONB := '[]'::jsonb;
  resolved_property_id UUID;
  property_code_input TEXT;
BEGIN
  -- Check if caller is admin or super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN jsonb_build_object('error', 'Only administrators can bulk create users');
  END IF;
  
  -- Process each user in the data array
  FOR user_record IN SELECT * FROM jsonb_array_elements(users_data)
  LOOP
    BEGIN
      -- Validate required fields
      IF (user_record ->> 'email' IS NULL OR user_record ->> 'email' = '') AND 
         (user_record ->> 'mobile_number' IS NULL OR user_record ->> 'mobile_number' = '') THEN
        error_results := error_results || jsonb_build_object(
          'emp_id', user_record ->> 'emp_id',
          'row_number', user_record ->> 'row_number',
          'error', 'Either email or mobile number is required'
        );
        error_count := error_count + 1;
        CONTINUE;
      END IF;
      
      -- Resolve property_code to property_id
      resolved_property_id := NULL;
      property_code_input := user_record ->> 'property_code';
      
      IF property_code_input IS NOT NULL AND property_code_input != '' THEN
        SELECT id INTO resolved_property_id
        FROM public.properties
        WHERE code = property_code_input OR name = property_code_input
        LIMIT 1;
        
        IF resolved_property_id IS NULL THEN
          error_results := error_results || jsonb_build_object(
            'emp_id', user_record ->> 'emp_id',
            'row_number', user_record ->> 'row_number',
            'error', format('Property not found: %s', property_code_input)
          );
          error_count := error_count + 1;
          CONTINUE;
        END IF;
      END IF;
      
      -- Create user invitation with property_id
      INSERT INTO public.user_invitations (
        email,
        mobile_number,
        first_name,
        last_name,
        role,
        role_title,
        department,
        specialization,
        password,
        emp_id,
        property_id,
        invited_by,
        status
      ) VALUES (
        NULLIF(user_record ->> 'email', ''),
        NULLIF(user_record ->> 'mobile_number', ''),
        user_record ->> 'first_name',
        user_record ->> 'last_name',
        (user_record ->> 'role')::app_role,
        user_record ->> 'role',
        CASE 
          WHEN user_record ->> 'role' = 'tenant_manager' THEN NULL
          ELSE user_record ->> 'department'
        END,
        user_record ->> 'specialization',
        user_record ->> 'password',
        user_record ->> 'emp_id',
        resolved_property_id,
        auth.uid(),
        'pending'
      );
      
      success_results := success_results || jsonb_build_object(
        'emp_id', user_record ->> 'emp_id',
        'email', user_record ->> 'email',
        'mobile_number', user_record ->> 'mobile_number',
        'name', CONCAT(user_record ->> 'first_name', ' ', user_record ->> 'last_name'),
        'property_code', property_code_input
      );
      success_count := success_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      error_results := error_results || jsonb_build_object(
        'emp_id', user_record ->> 'emp_id',
        'row_number', user_record ->> 'row_number',
        'error', SQLERRM
      );
      error_count := error_count + 1;
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success_count', success_count,
    'error_count', error_count,
    'success_results', success_results,
    'error_results', error_results
  );
END;
$$;