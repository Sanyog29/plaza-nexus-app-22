-- Add user_id column to service_bookings if it doesn't exist with proper relationship
ALTER TABLE public.service_bookings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;