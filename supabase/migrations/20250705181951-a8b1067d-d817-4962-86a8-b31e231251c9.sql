-- Fix user deletion issue by adding CASCADE to foreign key constraint

-- First, drop the existing foreign key constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT profiles_id_fkey;

-- Add the foreign key constraint back with ON DELETE CASCADE
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Also update the RLS policy to allow cascade deletion
-- The existing policy "Only admins can delete profiles" should allow system cascades
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;

CREATE POLICY "Allow profile deletion for user cascade and admins" 
ON public.profiles 
FOR DELETE 
USING (
  -- Allow if current user is admin OR if it's a cascade deletion (no auth context)
  is_admin(auth.uid()) OR auth.uid() IS NULL
);