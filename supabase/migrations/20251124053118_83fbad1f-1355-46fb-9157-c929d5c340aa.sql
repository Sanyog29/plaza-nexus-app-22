-- Fix the caching issue by making get_user_management_data VOLATILE
-- This ensures fresh data is always fetched after updates
DROP FUNCTION IF EXISTS public.get_user_management_data(uuid);

CREATE OR REPLACE FUNCTION public.get_user_management_data(filter_property_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  role text,
  assigned_role_title text,
  department text,
  specialization text,
  phone_number text,
  approval_status text,
  approved_by uuid,
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  email text,
  confirmed_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  has_profile boolean,
  property_id uuid,
  property_name text,
  is_primary boolean
)
LANGUAGE sql
VOLATILE  -- Changed from STABLE to VOLATILE to prevent caching
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
WITH caller AS (
  SELECT
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin','super_admin')
    ) AS is_admin,
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role = 'super_admin'
    ) AS is_super_admin
),
admin_props AS (
  SELECT pa.property_id
  FROM public.property_assignments pa
  WHERE pa.user_id = auth.uid()
)
SELECT 
  au.id::uuid,
  COALESCE(p.first_name, '')::text AS first_name,
  COALESCE(p.last_name, '')::text AS last_name,
  COALESCE(ur.role::text, '')::text AS role,
  COALESCE(p.assigned_role_title, ur.role::text, '')::text AS assigned_role_title,
  COALESCE(p.department, '')::text AS department,
  COALESCE(p.specialization, '')::text AS specialization,
  COALESCE(p.phone_number, '')::text AS phone_number,
  COALESCE(p.approval_status::text, 'pending')::text AS approval_status,
  p.approved_by::uuid AS approved_by,
  p.approved_at::timestamptz AS approved_at,
  COALESCE(p.rejection_reason, '')::text AS rejection_reason,
  au.created_at::timestamptz AS created_at,
  au.updated_at::timestamptz AS updated_at,
  COALESCE(au.email, '')::text AS email,
  au.confirmed_at::timestamptz AS confirmed_at,
  au.last_sign_in_at::timestamptz AS last_sign_in_at,
  (p.id IS NOT NULL)::boolean AS has_profile,
  pa.property_id::uuid AS property_id,
  prop.name::text AS property_name,
  COALESCE(pa.is_primary, false)::boolean AS is_primary
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
LEFT JOIN public.property_assignments pa ON au.id = pa.user_id AND pa.is_primary = true
LEFT JOIN public.properties prop ON pa.property_id = prop.id
CROSS JOIN caller c
WHERE 
  au.aud = 'authenticated'
  AND au.deleted_at IS NULL
  AND c.is_admin = true
  AND (
    -- Super admins: all users when no filter
    (c.is_super_admin = true AND filter_property_id IS NULL)
    OR
    -- Super admins with explicit property filter
    (c.is_super_admin = true AND filter_property_id IS NOT NULL AND pa.property_id = filter_property_id)
    OR
    -- Regular admins: only users for properties they have access to AND match the provided filter
    (c.is_super_admin = false AND filter_property_id IS NOT NULL AND pa.property_id = filter_property_id AND EXISTS (
      SELECT 1 FROM admin_props ap WHERE ap.property_id = filter_property_id
    ))
  )
ORDER BY au.created_at DESC;
$function$;