-- First disable the audit trigger temporarily
DROP TRIGGER IF EXISTS trigger_track_profile_changes ON public.profiles;

-- Create missing profiles for orphaned users
INSERT INTO public.profiles (id, first_name, last_name, role, approval_status, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  'tenant_manager'::app_role as role,
  'pending'::approval_status as approval_status,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
  AND au.deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;

-- Re-enable the audit trigger but fix it to handle null auth.uid()
CREATE OR REPLACE FUNCTION public.track_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only track if there are actual changes and we have a valid auth context
  IF (TG_OP = 'UPDATE' AND NEW IS DISTINCT FROM OLD) OR TG_OP = 'INSERT' THEN
    -- Only log if we have a valid auth.uid(), otherwise skip logging
    IF auth.uid() IS NOT NULL THEN
      INSERT INTO public.profile_audit_logs (
        profile_id,
        changed_by,
        changes,
        action_type
      ) VALUES (
        COALESCE(NEW.id, OLD.id),
        auth.uid(),
        CASE 
          WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
          WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
            'old', to_jsonb(OLD),
            'new', to_jsonb(NEW)
          )
          ELSE to_jsonb(OLD)
        END,
        LOWER(TG_OP)
      );
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Re-create the trigger
CREATE TRIGGER trigger_track_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.track_profile_changes();

-- Create the repair function
CREATE OR REPLACE FUNCTION public.repair_orphaned_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  repaired_count INTEGER := 0;
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, approval_status, created_at, updated_at)
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
    'tenant_manager'::app_role as role,
    'pending'::approval_status as approval_status,
    au.created_at,
    NOW() as updated_at
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
    AND au.deleted_at IS NULL
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS repaired_count = ROW_COUNT;
  RETURN repaired_count;
END;
$$;