-- ============================================
-- COMPREHENSIVE USER MANAGEMENT FIX
-- ============================================
-- This migration ensures users never disappear from listings
-- and approval is independent of property assignment

-- Step 1: Create "Unassigned" property as default
INSERT INTO public.properties (
  id,
  name,
  code,
  address,
  city,
  state,
  postal_code,
  country,
  property_type,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Unassigned',
  'UNASSIGNED',
  'System Default',
  'N/A',
  'N/A',
  '00000',
  'N/A',
  'other',
  'active'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code;

-- Step 2: Update approve_user function to auto-assign default property
DROP FUNCTION IF EXISTS public.approve_user(uuid, uuid);

CREATE OR REPLACE FUNCTION public.approve_user(target_user_id uuid, approver_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  target_property_id uuid;
  invitation_property_id uuid;
  unassigned_property_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Super admins can approve anyone
  IF public.is_super_admin(approver_id) THEN
    -- Check existing property assignment
    SELECT property_id INTO target_property_id
    FROM public.property_assignments
    WHERE user_id = target_user_id AND is_primary = true
    LIMIT 1;
    
    -- If no property, check invitation
    IF target_property_id IS NULL THEN
      SELECT property_id INTO invitation_property_id
      FROM public.user_invitations
      WHERE (email = (SELECT email FROM auth.users WHERE id = target_user_id))
         OR (mobile_number = (SELECT phone FROM auth.users WHERE id = target_user_id))
      ORDER BY created_at DESC
      LIMIT 1;
      
      -- Create property assignment from invitation or use default "Unassigned"
      INSERT INTO public.property_assignments (user_id, property_id, is_primary, assigned_by)
      VALUES (target_user_id, COALESCE(invitation_property_id, unassigned_property_id), true, approver_id)
      ON CONFLICT (user_id, property_id) DO UPDATE SET is_primary = true;
    END IF;
    
    -- Approve user
    UPDATE public.profiles
    SET 
      approval_status = 'approved',
      approved_by = approver_id,
      approved_at = now(),
      rejection_reason = NULL
    WHERE id = target_user_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'User approved successfully');
  END IF;
  
  -- Regular admins: check property assignment
  SELECT property_id INTO target_property_id
  FROM public.property_assignments
  WHERE user_id = target_user_id AND is_primary = true
  LIMIT 1;
  
  IF target_property_id IS NULL THEN
    -- Check if user has invitation with property
    SELECT property_id INTO invitation_property_id
    FROM public.user_invitations
    WHERE (email = (SELECT email FROM auth.users WHERE id = target_user_id))
       OR (mobile_number = (SELECT phone FROM auth.users WHERE id = target_user_id))
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF invitation_property_id IS NOT NULL THEN
      -- Create property assignment from invitation
      INSERT INTO public.property_assignments (user_id, property_id, is_primary, assigned_by)
      VALUES (target_user_id, invitation_property_id, true, approver_id)
      ON CONFLICT (user_id, property_id) DO UPDATE SET is_primary = true;
      
      target_property_id := invitation_property_id;
    ELSE
      -- Assign to "Unassigned" property
      INSERT INTO public.property_assignments (user_id, property_id, is_primary, assigned_by)
      VALUES (target_user_id, unassigned_property_id, true, approver_id)
      ON CONFLICT (user_id, property_id) DO UPDATE SET is_primary = true;
      
      target_property_id := unassigned_property_id;
    END IF;
  END IF;
  
  -- Check if admin has access to the target property (skip for Unassigned)
  IF target_property_id != unassigned_property_id AND NOT public.user_has_property_access(approver_id, target_property_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admins can only approve users in their assigned properties');
  END IF;
  
  -- Approve user
  UPDATE public.profiles
  SET 
    approval_status = 'approved',
    approved_by = approver_id,
    approved_at = now(),
    rejection_reason = NULL
  WHERE id = target_user_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'User approved successfully');
END;
$function$;

-- Step 3: Update get_user_management_data to show unassigned users
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
VOLATILE
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
    -- Super admins with NO filter → show ALL users (including unassigned)
    (c.is_super_admin = true AND filter_property_id IS NULL)
    OR
    -- Super admins with filter → show users WITH that property OR users WITHOUT any property (NULL)
    (c.is_super_admin = true AND filter_property_id IS NOT NULL AND (pa.property_id = filter_property_id OR pa.property_id IS NULL))
    OR
    -- Regular admins with filter → only users for properties they have access to
    (c.is_super_admin = false AND filter_property_id IS NOT NULL AND pa.property_id = filter_property_id AND EXISTS (
      SELECT 1 FROM admin_props ap WHERE ap.property_id = filter_property_id
    ))
  )
ORDER BY au.created_at DESC;
$function$;