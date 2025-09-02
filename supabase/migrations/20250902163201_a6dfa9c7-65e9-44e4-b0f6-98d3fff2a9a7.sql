-- Fix role assignment issues by removing fallback logic and creating direct role storage

-- Drop the problematic resolve_app_role function
DROP FUNCTION IF EXISTS public.resolve_app_role(text);

-- Create a new function that preserves the exact role without fallback
CREATE OR REPLACE FUNCTION public.get_role_from_title(input_role text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  resolved_role text;
BEGIN
  -- Try to find exact match in invitation_roles table
  SELECT app_role::text INTO resolved_role
  FROM public.invitation_roles
  WHERE (title = input_role OR slug = input_role OR app_role::text = input_role)
    AND is_active = true
  LIMIT 1;
  
  -- If found, return it, otherwise return input as-is
  IF resolved_role IS NOT NULL THEN
    RETURN resolved_role;
  END IF;
  
  -- Return the input role as-is (no fallback to 'tenant')
  RETURN input_role;
END;
$$;

-- Add a new column to profiles to store the original assigned role title
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS assigned_role_title text;

-- Update existing profiles to have their role title from invitation_roles
UPDATE public.profiles 
SET assigned_role_title = (
  SELECT title 
  FROM public.invitation_roles 
  WHERE app_role::text = profiles.role::text 
  LIMIT 1
)
WHERE assigned_role_title IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_role_title ON public.profiles(assigned_role_title);

-- Update the get_user_management_data function to return the assigned role title
CREATE OR REPLACE FUNCTION public.get_user_management_data(caller_id uuid)
RETURNS TABLE (
    id uuid,
    first_name text,
    last_name text,
    role text,
    assigned_role_title text,
    approval_status text,
    approved_by uuid,
    approved_at timestamptz,
    rejection_reason text,
    created_at timestamptz,
    updated_at timestamptz,
    email text,
    confirmed_at timestamptz,
    last_sign_in_at timestamptz,
    has_profile boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = caller_id 
        AND profiles.role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin privileges required.';
    END IF;

    RETURN QUERY
    SELECT 
        au.id,
        COALESCE(p.first_name, '') as first_name,
        COALESCE(p.last_name, '') as last_name,
        COALESCE(p.role::text, '') as role,
        COALESCE(p.assigned_role_title, p.role::text, '') as assigned_role_title,
        COALESCE(p.approval_status, 'pending') as approval_status,
        p.approved_by,
        p.approved_at,
        p.rejection_reason,
        au.created_at,
        au.updated_at,
        COALESCE(au.email, '') as email,
        au.confirmed_at,
        au.last_sign_in_at,
        (p.id IS NOT NULL) as has_profile
    FROM 
        auth.users au
    LEFT JOIN 
        public.profiles p ON au.id = p.id
    WHERE 
        au.aud = 'authenticated'
    ORDER BY 
        au.created_at DESC;
END;
$$;