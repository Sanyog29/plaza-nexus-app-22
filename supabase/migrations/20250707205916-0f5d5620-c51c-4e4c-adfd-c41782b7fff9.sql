-- Phase 1: Database Foundation - Create automatic profile creation trigger

-- First, update the existing handle_new_user function to use the correct role enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (new.id, '', '', 'tenant_manager'::app_role);
  RETURN new;
END;
$function$;

-- Drop existing trigger if it exists and recreate it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure all existing users have profile records
INSERT INTO public.profiles (id, first_name, last_name, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  'tenant_manager'::app_role as role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;