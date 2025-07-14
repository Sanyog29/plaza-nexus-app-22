-- Fix missing RLS policies for alerts table
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for alerts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'alerts' AND policyname = 'Admins can manage alerts'
    ) THEN
        CREATE POLICY "Admins can manage alerts" ON public.alerts
        FOR ALL 
        TO authenticated
        USING (public.is_admin(auth.uid()));
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'alerts' AND policyname = 'Staff can view alerts'
    ) THEN
        CREATE POLICY "Staff can view alerts" ON public.alerts
        FOR SELECT 
        TO authenticated
        USING (public.is_staff(auth.uid()));
    END IF;
END$$;

-- Add missing INSERT policy for notifications 
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications' AND policyname = 'System can create notifications'
    ) THEN
        CREATE POLICY "System can create notifications" ON public.notifications
        FOR INSERT 
        TO authenticated
        WITH CHECK (true);
    END IF;
END$$;

-- Ensure proper security for user invitations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_invitations' AND policyname = 'Admins can manage user invitations'
    ) THEN
        CREATE POLICY "Admins can manage user invitations" ON public.user_invitations
        FOR ALL 
        TO authenticated
        USING (public.is_admin(auth.uid()));
    END IF;
END$$;

-- Add policy for users to view their own invitations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_invitations' AND policyname = 'Users can view their invitation'
    ) THEN
        CREATE POLICY "Users can view their invitation" ON public.user_invitations
        FOR SELECT 
        TO authenticated
        USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
    END IF;
END$$;