-- Fix the is_admin function to properly reference the public.profiles table
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND role = 'admin'
  );
$function$;

-- Fix the is_staff function as well
CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = uid AND (role = 'admin' OR role = 'staff')
  );
$function$;