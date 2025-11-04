-- Add procurement roles to invitation_roles table
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
) VALUES 
(
  'Procurement Manager', 
  'procurement_manager', 
  'procurement_manager', 
  true, 
  false, 
  100, 
  'Procurement',
  NULL,
  'bg-sky-100 text-sky-800 border-sky-200'
),
(
  'Purchase Executive', 
  'purchase_executive', 
  'purchase_executive', 
  true, 
  false, 
  101, 
  'Procurement',
  NULL,
  'bg-lime-100 text-lime-800 border-lime-200'
),
(
  'Property Manager', 
  'property_manager', 
  'property_manager', 
  true, 
  false, 
  102, 
  'Operations',
  NULL,
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200'
)
ON CONFLICT (slug) DO NOTHING;