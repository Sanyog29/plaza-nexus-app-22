-- Create admin function to manage vendor staff assignments
CREATE OR REPLACE FUNCTION public.admin_add_vendor_staff(
  p_user_id UUID,
  p_vendor_id UUID,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result JSONB;
  user_record RECORD;
  vendor_record RECORD;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only administrators can manage vendor staff');
  END IF;
  
  -- Validate user exists and get details
  SELECT * INTO user_record
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;
  
  -- Validate vendor exists and get details
  SELECT * INTO vendor_record
  FROM vendors
  WHERE id = p_vendor_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Vendor not found');
  END IF;
  
  -- Insert or update vendor staff assignment
  INSERT INTO vendor_staff (user_id, vendor_id, is_active)
  VALUES (p_user_id, p_vendor_id, p_is_active)
  ON CONFLICT (user_id, vendor_id) 
  DO UPDATE SET 
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
  
  -- Log the action
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(),
    'assign_vendor_staff',
    'vendor_staff',
    p_vendor_id,
    jsonb_build_object(
      'assigned_user_id', p_user_id,
      'vendor_id', p_vendor_id,
      'is_active', p_is_active,
      'assigned_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('User %s %s successfully %s to vendor %s',
      user_record.first_name,
      user_record.last_name,
      CASE WHEN p_is_active THEN 'assigned' ELSE 'removed' END,
      COALESCE(vendor_record.name, 'Unknown Vendor')
    ),
    'user_name', format('%s %s', user_record.first_name, user_record.last_name),
    'vendor_name', COALESCE(vendor_record.name, 'Unknown Vendor')
  );
END;
$$;

-- Create function to get vendor staff assignments for admin interface
CREATE OR REPLACE FUNCTION public.admin_get_vendor_staff_assignments()
RETURNS TABLE(
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  vendor_id UUID,
  vendor_name TEXT,
  is_active BOOLEAN,
  assigned_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view vendor staff assignments';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id as user_id,
    CONCAT(p.first_name, ' ', p.last_name) as user_name,
    p.email as user_email,
    v.id as vendor_id,
    COALESCE(v.name, 'Unknown Vendor') as vendor_name,
    vs.is_active,
    vs.created_at as assigned_at
  FROM vendor_staff vs
  JOIN profiles p ON vs.user_id = p.id
  JOIN vendors v ON vs.vendor_id = v.id
  ORDER BY vs.created_at DESC;
END;
$$;