-- Add approval status enum and fields to profiles table
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add approval fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'pending',
ADD COLUMN approved_by uuid REFERENCES public.profiles(id),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text;

-- Update existing users to be approved (so they don't lose access)
UPDATE public.profiles SET approval_status = 'approved', approved_at = now() WHERE approval_status = 'pending';

-- Update the handle_new_user function to set pending status for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, approval_status)
  VALUES (new.id, '', '', 'tenant_manager'::app_role, 'pending'::approval_status);
  RETURN new;
END;
$function$;

-- Create function to check if user is approved
CREATE OR REPLACE FUNCTION public.is_approved_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND approval_status = 'approved'
  );
$function$;

-- Add RLS policy to restrict access to approved users only
CREATE POLICY "Only approved users can access data" ON public.profiles
FOR ALL TO authenticated
USING (
  approval_status = 'approved' OR 
  is_admin(auth.uid()) OR 
  id = auth.uid()
);