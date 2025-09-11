-- Add Food Vendor invitation role
INSERT INTO public.invitation_roles (
  title,
  slug,
  app_role,
  user_category,
  is_active,
  requires_specialization,
  color_class,
  sort_order
) VALUES (
  'Food Vendor',
  'food_vendor',
  'vendor',
  'food_vendor',
  true,
  false,
  'bg-yellow-100 text-yellow-800 border-yellow-200',
  100
);