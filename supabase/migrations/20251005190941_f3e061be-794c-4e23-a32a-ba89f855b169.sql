-- Phase 1: Sync missing profile data from auth.users
UPDATE profiles p
SET 
  first_name = COALESCE(p.first_name, au.raw_user_meta_data->>'first_name'),
  last_name = COALESCE(p.last_name, au.raw_user_meta_data->>'last_name'),
  email = COALESCE(p.email, au.email),
  updated_at = now()
FROM auth.users au
WHERE p.id = au.id
  AND (
    (p.first_name IS NULL OR p.first_name = '') OR
    (p.last_name IS NULL OR p.last_name = '') OR
    (p.email IS NULL OR p.email = '')
  );

-- Phase 3: Improve handle_new_user trigger to always sync email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    role,
    approval_status,
    department,
    specialization,
    phone_number,
    office_number,
    floor,
    mobile_number,
    email
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'tenant_manager'::app_role),
    'pending'::approval_status,
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'specialization',
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'office_number',
    NEW.raw_user_meta_data->>'floor',
    NEW.raw_user_meta_data->>'mobile_number',
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    department = COALESCE(EXCLUDED.department, profiles.department),
    specialization = COALESCE(EXCLUDED.specialization, profiles.specialization),
    mobile_number = COALESCE(EXCLUDED.mobile_number, profiles.mobile_number),
    email = COALESCE(EXCLUDED.email, profiles.email),
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Phase 4: Create reliable user display name function
CREATE OR REPLACE FUNCTION public.get_user_display_name(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  display_name text;
  profile_first text;
  profile_last text;
  profile_email text;
  auth_first text;
  auth_last text;
  auth_email text;
BEGIN
  -- Try to get from profiles first
  SELECT first_name, last_name, email
  INTO profile_first, profile_last, profile_email
  FROM public.profiles
  WHERE id = user_uuid;
  
  -- If profile data is complete, return it
  IF profile_first IS NOT NULL AND profile_first != '' 
     AND profile_last IS NOT NULL AND profile_last != '' THEN
    RETURN profile_first || ' ' || profile_last;
  END IF;
  
  -- Fall back to auth.users metadata
  SELECT 
    raw_user_meta_data->>'first_name',
    raw_user_meta_data->>'last_name',
    email
  INTO auth_first, auth_last, auth_email
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Build name from available data
  IF auth_first IS NOT NULL AND auth_first != '' 
     AND auth_last IS NOT NULL AND auth_last != '' THEN
    RETURN auth_first || ' ' || auth_last;
  ELSIF profile_first IS NOT NULL AND profile_first != '' 
        AND profile_last IS NOT NULL AND profile_last != '' THEN
    RETURN profile_first || ' ' || profile_last;
  ELSIF auth_first IS NOT NULL AND auth_first != '' THEN
    RETURN auth_first;
  ELSIF profile_first IS NOT NULL AND profile_first != '' THEN
    RETURN profile_first;
  ELSIF auth_email IS NOT NULL AND auth_email != '' THEN
    RETURN split_part(auth_email, '@', 1);
  ELSIF profile_email IS NOT NULL AND profile_email != '' THEN
    RETURN split_part(profile_email, '@', 1);
  ELSE
    RETURN 'Unknown User';
  END IF;
END;
$$;