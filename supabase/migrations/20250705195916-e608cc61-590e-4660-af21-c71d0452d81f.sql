-- Update the user role to admin so they can access user management
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE id = '370ef683-fbd0-4a91-a730-6c98715962e0';