-- Security fixes migration
-- Fix 1: Tighten profiles RLS policies to prevent PII exposure
DROP POLICY IF EXISTS "Anyone can view approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create restrictive profile policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_staff(auth.uid()) OR is_admin(auth.uid()));

-- Fix 2: Tighten maintenance_requests UPDATE policies
DROP POLICY IF EXISTS "Staff can update requests" ON public.maintenance_requests;

-- Create specific UPDATE policies for maintenance_requests
CREATE POLICY "Assigned technicians can update their requests" 
ON public.maintenance_requests 
FOR UPDATE 
USING (auth.uid() = assigned_to);

CREATE POLICY "Admins can update any request" 
ON public.maintenance_requests 
FOR UPDATE 
USING (is_admin(auth.uid()));

CREATE POLICY "Supervisors can update requests" 
ON public.maintenance_requests 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'ops_supervisor'
  )
);

-- Fix 3: Update complete_request RPC to use 'completed' status instead of 'closed'
CREATE OR REPLACE FUNCTION public.complete_request(
  request_id uuid,
  closure_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  request_record RECORD;
BEGIN
  -- Get the request details
  SELECT * INTO request_record
  FROM maintenance_requests
  WHERE id = request_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  
  -- Check if user is assigned to this request or is admin/supervisor
  IF NOT (
    request_record.assigned_to = auth.uid() OR 
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'ops_supervisor'
    )
  ) THEN
    RAISE EXCEPTION 'Not authorized to complete this request';
  END IF;
  
  -- Update the request status to completed (not closed)
  UPDATE maintenance_requests
  SET 
    status = 'completed',
    completed_at = now(),
    closure_notes = COALESCE(complete_request.closure_notes, maintenance_requests.closure_notes),
    updated_at = now()
  WHERE id = request_id;
  
  RETURN FOUND;
END;
$$;

-- Fix 4: Harden SECURITY DEFINER functions with proper search_path and stability
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = $1 AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = $1 AND role IN ('admin', 'ops_supervisor', 'field_staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_approved_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = $1 AND approval_status = 'approved'
  );
$$;

-- Update other SECURITY DEFINER functions for consistency
CREATE OR REPLACE FUNCTION public.approve_user(target_user_id uuid, approver_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT is_admin(approver_id) THEN
    RAISE EXCEPTION 'Only administrators can approve users';
  END IF;

  -- Update the user's approval status
  UPDATE profiles 
  SET approval_status = 'approved',
      approved_by = approver_id,
      approved_at = now(),
      updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_user(target_user_id uuid, approver_id uuid, reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if the caller is an admin
  IF NOT is_admin(approver_id) THEN
    RAISE EXCEPTION 'Only administrators can reject users';
  END IF;

  -- Update the user's approval status
  UPDATE profiles 
  SET approval_status = 'rejected',
      approved_by = approver_id,
      approved_at = now(),
      rejection_reason = reason,
      updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;