-- Fix missing RLS policies for alerts table
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for alerts table
CREATE POLICY "Admins can manage alerts" ON public.alerts
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Staff can view alerts" ON public.alerts
FOR SELECT 
TO authenticated
USING (public.is_staff(auth.uid()));

-- Add missing INSERT policy for notifications 
CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Fix notification update policy
CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Ensure proper security for user invitations
DROP POLICY IF EXISTS "Only admins can manage user invitations" ON public.user_invitations;
CREATE POLICY "Admins can manage user invitations" ON public.user_invitations
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Add policy for users to view their own invitations
CREATE POLICY "Users can view their invitation" ON public.user_invitations
FOR SELECT 
TO authenticated
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));