-- Fix Function Search Path Mutable security issue
-- Add SET search_path = public to all functions that don't have it

-- Functions that need search_path added:
CREATE OR REPLACE FUNCTION public.is_vendor_staff_for_vendor(user_id uuid, target_vendor_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_staff
    WHERE vendor_staff.user_id = $1 
    AND vendor_staff.vendor_id = $2 
    AND vendor_staff.is_active = true
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_food_vendor_staff_for_vendor(user_id uuid, target_vendor_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_staff vs
    JOIN public.profiles p ON vs.user_id = p.id
    WHERE vs.user_id = $1 
    AND vs.vendor_id = $2 
    AND vs.is_active = true
    AND p.user_category = 'food_vendor'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_approved_user(user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND approval_status = 'approved'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_staff(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = $1
      AND role IN (
        'admin',
        'ops_supervisor',
        'field_staff',
        'mst',
        'fe',
        'staff',
        'hk',
        'se',
        'assistant_manager',
        'assistant_floor_manager',
        'assistant_general_manager',
        'assistant_vice_president',
        'vp',
        'cxo',
        'ceo',
        'tenant_manager',
        'super_tenant'
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = $1 AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.role_level(user_role app_role)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT CASE user_role
    WHEN 'mst' THEN 'L1'
    WHEN 'fe' THEN 'L1'
    WHEN 'hk' THEN 'L1'
    WHEN 'se' THEN 'L1'
    WHEN 'assistant_manager' THEN 'L2'
    WHEN 'assistant_floor_manager' THEN 'L2'
    WHEN 'assistant_general_manager' THEN 'L3'
    WHEN 'assistant_vice_president' THEN 'L3'
    WHEN 'vp' THEN 'L4'
    WHEN 'ceo' THEN 'L4'
    WHEN 'cxo' THEN 'L4'
    ELSE 'other'
  END;
$function$;

CREATE OR REPLACE FUNCTION public.is_l1(uid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('mst', 'fe', 'hk', 'se')
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_public_profile_fields(profile_id uuid)
 RETURNS TABLE(id uuid, first_name text, last_name text, avatar_url text, department text, floor text, zone text, bio text, skills text[], interests text[], designation text, role app_role, approval_status approval_status)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT 
    id, 
    first_name, 
    last_name, 
    avatar_url, 
    department,
    floor, 
    zone, 
    bio, 
    skills, 
    interests, 
    designation,
    role, 
    approval_status
  FROM public.profiles
  WHERE id = profile_id 
    AND approval_status = 'approved';
$function$;