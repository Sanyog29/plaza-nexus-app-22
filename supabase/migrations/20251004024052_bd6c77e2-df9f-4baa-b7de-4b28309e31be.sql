-- PHASE 2: DATABASE SECURITY OVERHAUL
-- Comprehensive column-level security for profiles table

-- Step 1: Create function to check if user can view sensitive profile data
CREATE OR REPLACE FUNCTION public.can_view_profile_sensitive_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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
  
  -- Staff supervisors can view their team's data (if supervisor_id is set)
  IF is_staff(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = target_user_id 
      AND supervisor_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Step 2: Create function to get sensitive profile fields with permission check
CREATE OR REPLACE FUNCTION public.get_sensitive_profile_fields(profile_id uuid)
RETURNS TABLE (
  email text,
  phone_number text,
  mobile_number text,
  government_id text,
  employee_id text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relationship text,
  office_number text,
  password_hash text
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Check permission first
  IF NOT public.can_view_profile_sensitive_data(profile_id) THEN
    RAISE EXCEPTION 'Access denied: You do not have permission to view sensitive data for this profile';
  END IF;
  
  -- Log access to sensitive data
  INSERT INTO public.sensitive_profile_access_log (
    accessed_by, 
    target_user_id, 
    fields_accessed,
    access_reason
  ) VALUES (
    auth.uid(),
    profile_id,
    ARRAY['email', 'phone_number', 'mobile_number', 'government_id', 'employee_id', 'emergency_contact_name', 'emergency_contact_phone', 'office_number'],
    'Authorized access via get_sensitive_profile_fields function'
  );
  
  -- Return sensitive fields
  RETURN QUERY
  SELECT 
    p.email,
    p.phone_number,
    p.mobile_number,
    p.government_id,
    p.employee_id,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    p.emergency_contact_relationship,
    p.office_number,
    p.password_hash
  FROM public.profiles p
  WHERE p.id = profile_id;
END;
$$;

-- Step 3: Create a combined function to get full profile with permission checks
CREATE OR REPLACE FUNCTION public.get_full_profile(profile_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  public_data jsonb;
  sensitive_data jsonb;
  can_view_sensitive boolean;
BEGIN
  -- Get public fields (always allowed for approved profiles)
  SELECT jsonb_build_object(
    'id', id,
    'first_name', first_name,
    'last_name', last_name,
    'avatar_url', avatar_url,
    'department', department,
    'floor', floor,
    'zone', zone,
    'bio', bio,
    'skills', skills,
    'interests', interests,
    'designation', designation,
    'role', role,
    'approval_status', approval_status,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO public_data
  FROM public.profiles
  WHERE id = profile_id;
  
  -- Check if can view sensitive data
  can_view_sensitive := public.can_view_profile_sensitive_data(profile_id);
  
  IF can_view_sensitive THEN
    -- Log access
    INSERT INTO public.sensitive_profile_access_log (
      accessed_by, 
      target_user_id, 
      fields_accessed,
      access_reason
    ) VALUES (
      auth.uid(),
      profile_id,
      ARRAY['email', 'phone_number', 'mobile_number', 'government_id', 'employee_id', 'emergency_contact_name', 'emergency_contact_phone', 'office_number'],
      'Full profile access via get_full_profile function'
    );
    
    -- Get sensitive fields
    SELECT jsonb_build_object(
      'email', email,
      'phone_number', phone_number,
      'mobile_number', mobile_number,
      'government_id', government_id,
      'employee_id', employee_id,
      'emergency_contact_name', emergency_contact_name,
      'emergency_contact_phone', emergency_contact_phone,
      'emergency_contact_relationship', emergency_contact_relationship,
      'office_number', office_number
    ) INTO sensitive_data
    FROM public.profiles
    WHERE id = profile_id;
    
    -- Merge public and sensitive data
    RETURN public_data || sensitive_data;
  ELSE
    -- Return only public data
    RETURN public_data;
  END IF;
END;
$$;

-- Step 4: Create view for public profiles (safe fields only)
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT 
  id,
  first_name,
  last_name,
  avatar_url,
  department,
  floor,
  zone,
  bio,
  skills,
  interests,
  designation,
  role,
  approval_status,
  created_at,
  updated_at
FROM public.profiles
WHERE approval_status = 'approved';

-- Grant access to the public view
GRANT SELECT ON public.profiles_public TO authenticated;

COMMENT ON VIEW public.profiles_public IS 
'Public-safe view of profiles containing only non-sensitive fields. Use this for user directories, search, and public profile displays.';

-- Step 5: Add index for supervisor_id for performance
CREATE INDEX IF NOT EXISTS idx_profiles_supervisor_id ON public.profiles(supervisor_id) WHERE supervisor_id IS NOT NULL;

-- Step 6: Add comments for documentation
COMMENT ON FUNCTION public.can_view_profile_sensitive_data(uuid) IS 
'Security function to check if the current user has permission to view sensitive profile data. Returns true for: profile owner, admins, and supervisors of the user.';

COMMENT ON FUNCTION public.get_public_profile_fields(uuid) IS 
'Returns only safe, non-sensitive profile fields. Use this for public profile displays, user directories, and search results.';

COMMENT ON FUNCTION public.get_sensitive_profile_fields(uuid) IS 
'Returns sensitive profile fields with permission checks and audit logging. Raises exception if access denied.';

COMMENT ON FUNCTION public.get_full_profile(uuid) IS 
'Returns complete profile with automatic permission checks. Sensitive fields are only included if user has permission. Automatically logs access to sensitive data.';