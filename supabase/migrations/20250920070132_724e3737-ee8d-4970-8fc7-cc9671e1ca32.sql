-- Create admin function to get approved users securely
CREATE OR REPLACE FUNCTION public.admin_get_approved_users()
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  email text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view user data';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.first_name, '') as first_name,
    COALESCE(p.last_name, '') as last_name,
    COALESCE(p.email, '') as email,
    COALESCE(p.role::text, 'tenant_manager') as role
  FROM profiles p
  WHERE p.approval_status = 'approved'
  ORDER BY p.first_name, p.last_name;
END;
$function$;

-- Improve the vendor staff assignments function with better name fallback
CREATE OR REPLACE FUNCTION public.admin_get_vendor_staff_assignments()
RETURNS TABLE(
  user_id uuid,
  user_name text,
  user_email text,
  vendor_id uuid,
  vendor_name text,
  is_active boolean,
  assigned_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can view vendor staff assignments';
  END IF;

  RETURN QUERY
  SELECT 
    vs.user_id,
    CASE 
      WHEN TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, ''))) = '' THEN
        COALESCE(p.email, 'Unknown User')
      ELSE
        TRIM(CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')))
    END as user_name,
    COALESCE(p.email, '') as user_email,
    vs.vendor_id,
    COALESCE(v.name, 'Unknown Vendor') as vendor_name,
    vs.is_active,
    vs.created_at as assigned_at
  FROM vendor_staff vs
  JOIN profiles p ON vs.user_id = p.id
  JOIN vendors v ON vs.vendor_id = v.id
  ORDER BY vs.created_at DESC;
END;
$function$;