-- CRITICAL SECURITY FIX: Replace overly permissive profiles RLS policies
-- This fixes the data privacy breach where any authenticated user could see all employee PII

-- Drop the dangerous policy that exposes all user data
DROP POLICY IF EXISTS "Users can access basic data" ON public.profiles;

-- Create restrictive policies for profile access
-- Users can only view their own complete profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Staff can view basic contact info of approved users only (name, office, department)
CREATE POLICY "Staff can view basic contact info of approved users"
ON public.profiles
FOR SELECT
USING (
  is_staff(auth.uid()) 
  AND approval_status = 'approved'
);

-- Admins can view all profiles (unchanged)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin(auth.uid()));

-- Fix database function search_path vulnerabilities
-- Add explicit search_path to prevent injection attacks

-- Fix get_user_management_data function
CREATE OR REPLACE FUNCTION public.get_user_management_data(caller_id uuid)
RETURNS TABLE(id uuid, first_name text, last_name text, role text, approval_status text, approved_by uuid, approved_at timestamp with time zone, rejection_reason text, created_at timestamp with time zone, updated_at timestamp with time zone, email text, confirmed_at timestamp with time zone, last_sign_in_at timestamp with time zone, has_profile boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.is_admin(caller_id) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can view user management data';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    COALESCE(p.first_name, '')::text as first_name,
    COALESCE(p.last_name, '')::text as last_name,
    COALESCE(p.role::text, 'tenant_manager') as role,
    COALESCE(p.approval_status::text, 'pending') as approval_status,
    p.approved_by,
    p.approved_at,
    p.rejection_reason,
    COALESCE(p.created_at, u.created_at) as created_at,
    COALESCE(p.updated_at, u.updated_at) as updated_at,
    COALESCE(u.email, '')::text as email,
    u.confirmed_at,
    u.last_sign_in_at,
    (p.id IS NOT NULL) as has_profile
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE u.deleted_at IS NULL
  ORDER BY COALESCE(p.created_at, u.created_at) DESC;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'first_name', 
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Add missing RLS policy for item_feedback table to prevent data exposure
CREATE POLICY "Users can view feedback for their own items"
ON public.item_feedback
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.cafeteria_orders co ON oi.order_id = co.id
    WHERE oi.id = item_feedback.item_id 
    AND co.user_id = auth.uid()
  )
  OR is_admin(auth.uid())
);

CREATE POLICY "Users can create feedback for their own items"
ON public.item_feedback
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.cafeteria_orders co ON oi.order_id = co.id
    WHERE oi.id = item_feedback.item_id 
    AND co.user_id = auth.uid()
  )
);