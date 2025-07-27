-- Add missing columns to user_invitations table
ALTER TABLE public.user_invitations 
ADD COLUMN phone_number text,
ADD COLUMN office_number text,
ADD COLUMN floor text;