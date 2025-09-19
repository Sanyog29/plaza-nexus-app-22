-- Fix the admin_get_vendor_staff_assignments function
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
    CONCAT(COALESCE(p.first_name, ''), ' ', COALESCE(p.last_name, '')) as user_name,
    COALESCE(p.email, '') as user_email,
    vs.vendor_id,
    COALESCE(v.name, '') as vendor_name,
    vs.is_active,
    vs.created_at as assigned_at
  FROM vendor_staff vs
  JOIN profiles p ON vs.user_id = p.id
  JOIN vendors v ON vs.vendor_id = v.id
  ORDER BY vs.created_at DESC;
END;
$function$