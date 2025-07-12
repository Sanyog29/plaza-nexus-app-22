-- Fix RLS policies for better user experience
-- Allow pending users to view data
DROP POLICY IF EXISTS "Only approved users can access data" ON public.profiles;
CREATE POLICY "Users can access basic data" ON public.profiles
FOR ALL USING (
  (approval_status = 'approved'::approval_status) OR 
  is_admin(auth.uid()) OR 
  (id = auth.uid())
);

-- Enable RLS on vendor notifications and stock alerts if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'vendor_notifications' AND relrowsecurity = true) THEN
        ALTER TABLE public.vendor_notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'stock_alerts' AND relrowsecurity = true) THEN
        ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;