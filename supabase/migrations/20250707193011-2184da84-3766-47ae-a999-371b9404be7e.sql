-- Update the current user's role to admin (based on recent auth logs showing user 370ef683...)
UPDATE public.profiles 
SET role = 'admin'::app_role,
    updated_at = now()
WHERE id = '370ef683-fbd0-4a91-a730-6c98715962e0';

-- Create user_roles table for future role management  
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

-- Insert admin role for the updated user
INSERT INTO public.user_roles (user_id, role)
VALUES ('370ef683-fbd0-4a91-a730-6c98715962e0', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;