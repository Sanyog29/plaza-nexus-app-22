-- Make the first registered user an admin
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE id = (
  SELECT id 
  FROM public.profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);