-- Phase 1: Security Hardening - Separate Roles Table (Complete Fix)

-- 1. Create user_roles table with proper security
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_secure(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role($1, 'admin');
$$;

-- 3. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Drop and recreate RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can assign roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can assign roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Update approve_user function
CREATE OR REPLACE FUNCTION public.approve_user(target_user_id uuid, approver_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_secure(approver_id) THEN
    RAISE EXCEPTION 'Only administrators can approve users';
  END IF;

  UPDATE public.profiles 
  SET approval_status = 'approved',
      approved_by = approver_id,
      approved_at = now(),
      updated_at = now()
  WHERE id = target_user_id;

  INSERT INTO public.user_roles (user_id, role, assigned_by)
  SELECT target_user_id, role, approver_id
  FROM public.profiles
  WHERE id = target_user_id
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN FOUND;
END;
$$;

-- 6. Update reject_user function
CREATE OR REPLACE FUNCTION public.reject_user(target_user_id uuid, approver_id uuid, reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_secure(approver_id) THEN
    RAISE EXCEPTION 'Only administrators can reject users';
  END IF;

  UPDATE public.profiles 
  SET approval_status = 'rejected',
      approved_by = approver_id,
      approved_at = now(),
      rejection_reason = reason,
      updated_at = now()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

-- 7. Update update_user_role function
CREATE OR REPLACE FUNCTION public.update_user_role(user_id uuid, new_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin_secure(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can update roles';
  END IF;

  UPDATE profiles 
  SET role = new_role::app_role, updated_at = now()
  WHERE id = user_id;

  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (user_id, new_role::app_role, auth.uid())
  ON CONFLICT (user_id, role) DO UPDATE
  SET assigned_by = auth.uid(), assigned_at = now();

  RETURN FOUND;
END;
$$;

-- 8. Create audit table
CREATE TABLE IF NOT EXISTS public.user_approval_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES auth.users(id),
    old_status TEXT,
    new_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_approval_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.user_approval_audit;
CREATE POLICY "Admins can view audit logs"
ON public.user_approval_audit FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Add trigger for audit logging
CREATE OR REPLACE FUNCTION log_approval_action()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') AND (OLD.approval_status IS DISTINCT FROM NEW.approval_status) THEN
    INSERT INTO public.user_approval_audit (
      user_id, action, performed_by, old_status, new_status
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.approval_status = 'approved' THEN 'approved'
        WHEN NEW.approval_status = 'rejected' THEN 'rejected'
        ELSE 'status_changed'
      END,
      NEW.approved_by,
      OLD.approval_status::TEXT,
      NEW.approval_status::TEXT
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS profile_approval_audit ON public.profiles;
CREATE TRIGGER profile_approval_audit
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION log_approval_action();

-- 10. Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;