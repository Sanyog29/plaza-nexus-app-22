
-- Fix the public_profiles view to use security_invoker
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  department,
  role,
  designation,
  floor,
  zone,
  approval_status,
  is_active
FROM public.profiles
WHERE approval_status = 'approved';

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated, anon;

COMMENT ON VIEW public.public_profiles IS 
'Public-safe view of employee profiles. Only shows non-sensitive information for approved users. 
Uses security_invoker to respect RLS policies of the querying user.';
