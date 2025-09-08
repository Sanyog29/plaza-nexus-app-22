
-- 1) Add email column to profiles, make it unique when present
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique
ON public.profiles (email)
WHERE email IS NOT NULL;

-- 2) Backfill emails from auth.users for existing rows
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- 3) Keep email in sync for new signups (update handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'tenant_manager'::app_role),
    'pending'::approval_status,
    NEW.raw_user_meta_data ->> 'department',
    NEW.raw_user_meta_data ->> 'specialization',
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'office_number',
    NEW.raw_user_meta_data ->> 'floor',
    NEW.raw_user_meta_data ->> 'mobile_number',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name     = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name      = COALESCE(EXCLUDED.last_name,  profiles.last_name),
    department     = COALESCE(EXCLUDED.department, profiles.department),
    specialization = COALESCE(EXCLUDED.specialization, profiles.specialization),
    mobile_number  = COALESCE(EXCLUDED.mobile_number, profiles.mobile_number),
    email          = COALESCE(EXCLUDED.email, profiles.email),
    updated_at     = now();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger to ensure it calls the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Keep email in sync on future auth email changes
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_email();
