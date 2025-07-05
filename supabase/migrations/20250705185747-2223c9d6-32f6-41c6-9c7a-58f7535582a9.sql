-- Create profile for the authenticated user
INSERT INTO public.profiles (id, first_name, last_name, role)
VALUES ('370b7036-6a01-4fa5-9d9c-7b5935abdb0a', '', '', 'tenant')
ON CONFLICT (id) DO NOTHING;