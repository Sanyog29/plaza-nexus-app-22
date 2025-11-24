-- Update is_admin() function to include super_admin role
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN $1 IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = $1 AND role IN ('admin', 'super_admin')
    )
  END;
$$;

-- Create helper function to create test pending user (with proper privileges)
CREATE OR REPLACE FUNCTION public.create_test_pending_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Get first approved user to convert to pending
  SELECT id INTO test_user_id 
  FROM profiles 
  WHERE approval_status = 'approved' 
  LIMIT 1;
  
  -- Update to pending if found
  IF test_user_id IS NOT NULL THEN
    UPDATE profiles 
    SET approval_status = 'pending',
        approved_by = NULL,
        approved_at = NULL,
        rejection_reason = NULL
    WHERE id = test_user_id;
  END IF;
  
  RETURN test_user_id;
END;
$$;