-- Fix RLS policies for approval workflow
-- Update maintenance_requests RLS policies to handle unapproved users properly

-- First, drop existing conflicting policies
DROP POLICY IF EXISTS "Users can see their own requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Users can manage their maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Users can create requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Users can delete their own pending requests" ON public.maintenance_requests;

-- Create new comprehensive RLS policies for maintenance_requests
-- Allow approved users and admins to view requests
CREATE POLICY "Approved users can view their own requests"
ON public.maintenance_requests
FOR SELECT
TO authenticated
USING (
  (auth.uid() = reported_by AND (
    SELECT approval_status FROM public.profiles WHERE id = auth.uid()
  ) = 'approved') OR
  is_admin(auth.uid()) OR
  is_staff(auth.uid())
);

-- Allow approved users to create requests
CREATE POLICY "Approved users can create requests"
ON public.maintenance_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = reported_by AND (
    (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved' OR
    is_admin(auth.uid())
  )
);

-- Allow approved users to update their own pending requests, staff can update any
CREATE POLICY "Users can update maintenance requests"
ON public.maintenance_requests
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = reported_by AND status = 'pending' AND (
    SELECT approval_status FROM public.profiles WHERE id = auth.uid()
  ) = 'approved') OR
  is_admin(auth.uid()) OR
  is_staff(auth.uid())
);

-- Allow approved users to delete their own pending requests, staff can delete any pending
CREATE POLICY "Users can delete pending requests"
ON public.maintenance_requests
FOR DELETE
TO authenticated
USING (
  (auth.uid() = reported_by AND status = 'pending' AND (
    SELECT approval_status FROM public.profiles WHERE id = auth.uid()
  ) = 'approved') OR
  is_admin(auth.uid()) OR
  is_staff(auth.uid())
);

-- Update request_comments RLS policies
DROP POLICY IF EXISTS "Users can see comments on their requests" ON public.request_comments;
DROP POLICY IF EXISTS "Users can add comments to their requests" ON public.request_comments;

CREATE POLICY "Approved users can view comments on their requests"
ON public.request_comments
FOR SELECT
TO authenticated
USING (
  (SELECT maintenance_requests.reported_by
   FROM maintenance_requests
   WHERE maintenance_requests.id = request_comments.request_id) = auth.uid() AND
  ((SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved' OR
   is_admin(auth.uid())) OR
  is_staff(auth.uid())
);

CREATE POLICY "Approved users can add comments"
ON public.request_comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND (
    (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved' OR
    is_admin(auth.uid()) OR
    is_staff(auth.uid())
  )
);

-- Update request_attachments RLS policies
DROP POLICY IF EXISTS "Users can view attachments for their requests" ON public.request_attachments;
DROP POLICY IF EXISTS "Users can upload attachments to their requests" ON public.request_attachments;

CREATE POLICY "Approved users can view attachments for their requests"
ON public.request_attachments
FOR SELECT
TO authenticated
USING (
  ((SELECT maintenance_requests.reported_by
    FROM maintenance_requests
    WHERE maintenance_requests.id = request_attachments.request_id) = auth.uid() AND
   ((SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved' OR
    is_admin(auth.uid()))) OR
  is_staff(auth.uid())
);

CREATE POLICY "Approved users can upload attachments"
ON public.request_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  ((SELECT maintenance_requests.reported_by
    FROM maintenance_requests
    WHERE maintenance_requests.id = request_attachments.request_id) = auth.uid()) AND
  (auth.uid() = uploaded_by) AND
  ((SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved' OR
   is_admin(auth.uid()) OR
   is_staff(auth.uid()))
);

-- Add function to approve users
CREATE OR REPLACE FUNCTION public.approve_user(target_user_id uuid, approver_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.is_admin(approver_id) THEN
    RAISE EXCEPTION 'Only administrators can approve users';
  END IF;

  -- Update the user's approval status
  UPDATE public.profiles 
  SET approval_status = 'approved',
      approved_by = approver_id,
      approved_at = now(),
      updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$function$;

-- Add function to reject users
CREATE OR REPLACE FUNCTION public.reject_user(target_user_id uuid, approver_id uuid, reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Check if the caller is an admin
  IF NOT public.is_admin(approver_id) THEN
    RAISE EXCEPTION 'Only administrators can reject users';
  END IF;

  -- Update the user's approval status
  UPDATE public.profiles 
  SET approval_status = 'rejected',
      approved_by = approver_id,
      approved_at = now(),
      rejection_reason = reason,
      updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$function$;