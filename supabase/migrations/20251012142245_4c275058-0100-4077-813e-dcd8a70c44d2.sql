-- Add Super Tenant to invitation_roles table for user management integration
INSERT INTO public.invitation_roles (
  title,
  slug,
  app_role,
  is_active,
  requires_specialization,
  color_class,
  sort_order,
  default_department,
  default_specialization
) VALUES (
  'Super Tenant',
  'super_tenant',
  'super_tenant',
  true,
  false,
  'bg-violet-100 text-violet-800 border-violet-200',
  24,
  NULL,
  NULL
) ON CONFLICT (slug) DO NOTHING;