-- Create a helper function to resolve app_role from various inputs
CREATE OR REPLACE FUNCTION public.resolve_app_role(input_role text)
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resolved_role app_role;
BEGIN
  -- First try direct match with app_role enum
  BEGIN
    resolved_role := input_role::app_role;
    RETURN resolved_role;
  EXCEPTION WHEN invalid_text_representation THEN
    -- Continue to next check
  END;
  
  -- Try to find by title or slug in invitation_roles table
  SELECT app_role INTO resolved_role
  FROM public.invitation_roles
  WHERE (title = input_role OR slug = input_role OR app_role::text = input_role)
    AND is_active = true
  LIMIT 1;
  
  IF resolved_role IS NOT NULL THEN
    RETURN resolved_role;
  END IF;
  
  -- Default fallback
  RETURN 'tenant'::app_role;
END;
$$;