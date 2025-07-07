-- Fix user role and create user_roles table for proper role management

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (is_admin(auth.uid()));

-- Update current user to admin role (for the user who is experiencing issues)
UPDATE public.profiles 
SET role = 'admin'::app_role,
    updated_at = now()
WHERE id = auth.uid();

-- Insert admin role in user_roles table for current user
INSERT INTO public.user_roles (user_id, role)
VALUES (auth.uid(), 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Create helper function for checking roles
CREATE OR REPLACE FUNCTION public.user_has_role(user_id uuid, check_role app_role)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = $2
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = $1 AND role = $2
  );
$$;