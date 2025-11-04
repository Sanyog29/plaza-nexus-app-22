-- Add standalone Field Expert role to invitation_roles table
INSERT INTO invitation_roles (
  title, 
  slug, 
  app_role, 
  is_active, 
  requires_specialization, 
  sort_order, 
  default_department, 
  default_specialization,
  color_class
) VALUES (
  'Field Expert', 
  'field_expert', 
  'fe', 
  true, 
  false, 
  50, 
  'Operations',
  NULL,
  'bg-green-100 text-green-800 border-green-200'
)
ON CONFLICT (slug) DO NOTHING;