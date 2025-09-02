-- Add default department and specialization columns to invitation_roles
ALTER TABLE public.invitation_roles 
ADD COLUMN default_department text,
ADD COLUMN default_specialization text;

-- Update existing invitation roles with department mappings
UPDATE public.invitation_roles SET 
  default_department = 'Operations',
  default_specialization = 'Multi Skilled Technician'
WHERE app_role = 'mst';

UPDATE public.invitation_roles SET 
  default_department = 'Operations',
  default_specialization = 'Technical Operations'
WHERE app_role = 'fe';

UPDATE public.invitation_roles SET 
  default_department = 'Operations',
  default_specialization = 'General Operations'
WHERE app_role = 'hk';

UPDATE public.invitation_roles SET 
  default_department = 'Operations',
  default_specialization = 'Site Engineering'
WHERE app_role = 'se';

UPDATE public.invitation_roles SET 
  default_department = 'Operations',
  default_specialization = 'Operations Management'
WHERE app_role = 'assistant_manager';

UPDATE public.invitation_roles SET 
  default_department = 'Operations',
  default_specialization = 'Operations Management'
WHERE app_role = 'assistant_floor_manager';

UPDATE public.invitation_roles SET 
  default_department = 'Administration',
  default_specialization = 'General Management'
WHERE app_role = 'assistant_general_manager';

UPDATE public.invitation_roles SET 
  default_department = 'Business Development',
  default_specialization = 'Business Development'
WHERE app_role = 'assistant_vice_president';

UPDATE public.invitation_roles SET 
  default_department = 'Operations',
  default_specialization = 'Operations Management'
WHERE app_role = 'vp';

UPDATE public.invitation_roles SET 
  default_department = 'Administration',
  default_specialization = 'Executive Management'
WHERE app_role = 'ceo';

UPDATE public.invitation_roles SET 
  default_department = 'Administration',
  default_specialization = 'Executive Management'
WHERE app_role = 'cxo';

-- No department for tenant_manager (they don't need one)
UPDATE public.invitation_roles SET 
  default_department = NULL,
  default_specialization = NULL
WHERE app_role = 'tenant_manager';

-- Create function to get role default department
CREATE OR REPLACE FUNCTION public.get_role_defaults(role_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_data RECORD;
BEGIN
  SELECT default_department, default_specialization
  INTO role_data
  FROM public.invitation_roles
  WHERE slug = role_slug AND is_active = true;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'department', role_data.default_department,
      'specialization', role_data.default_specialization
    );
  ELSE
    RETURN jsonb_build_object(
      'department', null,
      'specialization', null
    );
  END IF;
END;
$$;