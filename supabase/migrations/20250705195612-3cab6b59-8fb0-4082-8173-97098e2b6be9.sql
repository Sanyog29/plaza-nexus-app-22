-- Make the current user an admin for testing user management functionality
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = '370ef683-fbd0-4a91-a730-6c98715962e0';