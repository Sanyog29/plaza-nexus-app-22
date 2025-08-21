-- Fix security vulnerability: Restrict room_bookings access while maintaining functionality

-- First, drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all room bookings" ON public.room_bookings;

-- Create more secure policies
-- 1. Users can view their own bookings (full access)
CREATE POLICY "Users can view their own bookings" 
ON public.room_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Admins and staff can view all bookings (full access)
CREATE POLICY "Admins and staff can view all bookings" 
ON public.room_bookings 
FOR SELECT 
USING (is_admin(auth.uid()) OR is_staff(auth.uid()));

-- 3. Create a security definer function for room availability checking
-- This exposes only the minimal data needed for scheduling (no sensitive meeting details)
CREATE OR REPLACE FUNCTION public.get_room_availability_data(target_date date)
RETURNS TABLE(
  room_id uuid,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rb.room_id,
    rb.start_time,
    rb.end_time,
    rb.status
  FROM public.room_bookings rb
  WHERE rb.start_time::date = target_date 
    AND rb.status = 'confirmed';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_room_availability_data(date) TO authenticated;

-- Create a policy for viewing basic booking info for availability checking
-- This allows users to see when rooms are booked but not sensitive details
CREATE POLICY "Users can view basic booking info for availability" 
ON public.room_bookings 
FOR SELECT 
USING (true);

-- But we need to be more specific - let's drop this and use the function instead
DROP POLICY IF EXISTS "Users can view basic booking info for availability" ON public.room_bookings;