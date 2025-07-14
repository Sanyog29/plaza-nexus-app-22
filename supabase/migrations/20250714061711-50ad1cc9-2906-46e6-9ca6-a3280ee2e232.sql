-- Create the app_role enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'ops_supervisor', 'field_staff', 'tenant_manager', 'vendor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create the approval_status enum type if it doesn't exist  
DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recreate the handle_new_user function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, role, approval_status)
    VALUES (new.id, '', '', 'tenant_manager'::app_role, 'pending'::approval_status);
    RETURN new;
  EXCEPTION
    WHEN others THEN
      -- Log the error but don't block user creation
      RAISE LOG 'Error creating profile for user %: %', new.id, SQLERRM;
      RETURN new;
  END;
END;
$function$;