-- Fix the app_role enum to include all required role values
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'staff';

-- Update any existing profiles with 'staff' role to use proper roles
UPDATE profiles 
SET role = 'ops_supervisor'::app_role 
WHERE role::text = 'staff';

-- Add any missing enum values for completeness
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ops_supervisor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'field_staff';

-- Update the default role function to handle staff properly
CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('admin', 'ops_supervisor', 'field_staff')
  );
$$;