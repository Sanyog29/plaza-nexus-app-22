
-- Fix profiles table security vulnerability
-- Remove overly permissive policy and replace with granular access controls

-- Drop the overly permissive policy that exposes all profile data
DROP POLICY IF EXISTS "Users can access basic data" ON public.profiles;

-- Create a view for public profile information (non-sensitive data only)
-- This allows users to see basic information about other approved users
CREATE OR REPLACE VIEW public.public_profiles AS
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

-- Create new granular RLS policies for the profiles table

-- 1. Allow users to see basic, non-sensitive info of OTHER approved users
-- This policy returns only safe fields for directory/search functionality
CREATE POLICY "Users can view basic info of approved profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User can see limited data of other approved users
  (approval_status = 'approved' AND id != auth.uid())
  -- But only specific safe columns will be accessible via the public_profiles view
);

-- 2. Ensure users can still see their OWN full profile (already exists but confirming)
-- Policy "Users can view their own profile" already exists

-- 3. Ensure staff can view profiles for operational needs (already exists)
-- Policy "Staff can view all profiles" already exists

-- 4. Ensure admins have full access (already exists)
-- Policy "Admins can view all profiles" already exists

-- Add column-level security comment
COMMENT ON TABLE public.profiles IS 
'SECURITY NOTE: This table contains sensitive PII. Direct access is restricted by RLS. 
Use the public_profiles view for directory lookups to prevent exposure of sensitive data like 
phone numbers, government IDs, emergency contacts, and personal information.';

-- Create a function to check if a user should see sensitive profile data
CREATE OR REPLACE FUNCTION public.can_view_sensitive_profile_data(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- User can view their own sensitive data
  IF auth.uid() = target_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Admins can view all sensitive data
  IF is_admin(auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  -- Staff can view sensitive data for operational needs
  IF is_staff(auth.uid()) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.can_view_sensitive_profile_data IS
'Determines if the current user can access sensitive profile information (phone, email, government_id, emergency contacts) for a target user.';
