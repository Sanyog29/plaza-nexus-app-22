-- Add simple "Admin" role to invitation_roles table
INSERT INTO public.invitation_roles (
  id,
  slug,
  title,
  app_role,
  is_active,
  requires_specialization,
  sort_order,
  color_class
) VALUES (
  gen_random_uuid(),
  'admin',
  'Admin',
  'admin',
  true,
  false,
  0,
  'bg-red-100 text-red-800 border-red-200'
);