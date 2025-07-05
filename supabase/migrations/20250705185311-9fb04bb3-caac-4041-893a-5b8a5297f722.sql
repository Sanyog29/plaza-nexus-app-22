-- The user exists in auth but not in profiles. Create their profile.
-- This should have been done by the handle_new_user trigger but wasn't.
INSERT INTO public.profiles (id, first_name, last_name, role)
SELECT '370b7036-6a01-4fa5-9d9c-7b5935abdb0a', '', '', 'tenant'
WHERE EXISTS (
  SELECT 1 FROM auth.users WHERE id = '370b7036-6a01-4fa5-9d9c-7b5935abdb0a'
);