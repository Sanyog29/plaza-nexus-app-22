-- EMERGENCY ROLLBACK: Restore profiles.role column (bypass all security triggers)

-- 1. Drop ALL security triggers on profiles table
DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_profile_privilege_escalation() CASCADE;

DROP TRIGGER IF EXISTS encrypt_profile_sensitive_data_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.encrypt_profile_sensitive_data() CASCADE;

-- 2. Re-add role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text;

-- 3. Populate role from user_roles table
UPDATE public.profiles p
SET role = (
  SELECT ur.role::text 
  FROM public.user_roles ur 
  WHERE ur.user_id = p.id 
  LIMIT 1
)
WHERE p.role IS NULL;

-- 4. Set default for new users
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'tenant';

-- 5. Drop and recreate profiles_public view WITHOUT security definer
DROP VIEW IF EXISTS public.profiles_public CASCADE;

CREATE VIEW public.profiles_public AS
SELECT 
  id,
  first_name,
  last_name,
  role,
  department,
  phone_number,
  created_at,
  updated_at,
  approval_status,
  user_category
FROM public.profiles;

ALTER VIEW public.profiles_public SET (security_invoker = true);

-- 6. Recreate public_profiles as alias  
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT * FROM public.profiles_public;

ALTER VIEW public.public_profiles SET (security_invoker = true);

-- 7. Recreate monthly_leaderboard view
DROP VIEW IF EXISTS public.monthly_leaderboard;

CREATE VIEW public.monthly_leaderboard AS
SELECT 
  tp.technician_id,
  p.first_name,
  p.last_name,
  p.role,
  tp.points_earned,
  tp.points_balance,
  tp.current_tier,
  tp.updated_at,
  COUNT(mr.id) FILTER (
    WHERE mr.status = 'completed' 
    AND mr.completed_at >= date_trunc('month', CURRENT_DATE)
  ) as tickets_completed
FROM public.technician_points tp
JOIN public.profiles p ON p.id = tp.technician_id
LEFT JOIN public.maintenance_requests mr ON mr.assigned_to = tp.technician_id
GROUP BY 
  tp.technician_id,
  p.first_name,
  p.last_name,
  p.role,
  tp.points_earned,
  tp.points_balance,
  tp.current_tier,
  tp.updated_at;

-- 8. Create trigger to sync profiles.role with user_roles
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.profiles 
    SET role = NEW.role::text 
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.user_roles;
CREATE TRIGGER sync_profile_role_trigger
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_role();

-- 9. Recreate the privilege escalation prevention trigger (modified to allow sync)
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow sync from user_roles trigger
  IF TG_OP = 'UPDATE' AND (
    (NEW.role IS DISTINCT FROM OLD.role) OR 
    (NEW.approval_status IS DISTINCT FROM OLD.approval_status)
  ) THEN
    -- Check if this is from the sync trigger by comparing with user_roles
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = NEW.id AND role::text = NEW.role
    ) AND NOT is_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Access denied: Only administrators can modify role or approval fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_profile_privilege_escalation_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_privilege_escalation();