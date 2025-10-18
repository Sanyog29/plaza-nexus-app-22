-- Fix critical role storage vulnerability by preventing role updates in profiles table

-- Step 1: Sync existing roles from profiles to user_roles (if not already there)
INSERT INTO public.user_roles (user_id, role, assigned_by)
SELECT 
  p.id,
  p.role,
  p.id -- Self-assigned for existing data
FROM public.profiles p
WHERE p.role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 2: Drop the existing permissive UPDATE policy on profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Step 3: Create a new restrictive UPDATE policy that prevents role changes
CREATE POLICY "Users can update own profile (non-role fields)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent role changes by ensuring new role matches existing role
  role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Step 4: Create admin-only policy for updating roles via admin interface
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Step 5: Add comment explaining the security model
COMMENT ON TABLE public.user_roles IS 'Authoritative source for user roles. The role column in profiles table is kept for backwards compatibility but is read-only for non-admins.';

COMMENT ON POLICY "Users can update own profile (non-role fields)" ON public.profiles IS 'Users can update their profile but cannot change their role field to prevent privilege escalation';

COMMENT ON POLICY "Admins can update any profile" ON public.profiles IS 'Admins can update any profile including roles, but should use user_roles table as the authoritative source';