-- Add Super Admin role to invitation_roles table
INSERT INTO public.invitation_roles (
  app_role,
  title,
  slug,
  is_active,
  requires_specialization,
  color_class,
  sort_order,
  default_department,
  default_specialization
) VALUES (
  'super_admin',
  'Super Admin',
  'super_admin',
  true,
  false,
  'bg-red-500',
  0,
  NULL,
  NULL
)
ON CONFLICT (slug) DO NOTHING;