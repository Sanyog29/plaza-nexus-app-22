-- Update Saniel Golechha's role to admin
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE id = 'ca033878-3142-42e6-9db0-5566e7bc5469';