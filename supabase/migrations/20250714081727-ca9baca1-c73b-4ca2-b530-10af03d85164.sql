-- First, fix the audit table constraint
ALTER TABLE public.profile_audit_logs ALTER COLUMN changed_by DROP NOT NULL;

-- Update the trigger function to handle NULL auth.uid()
CREATE OR REPLACE FUNCTION public.track_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only track if there are actual changes
  IF (TG_OP = 'UPDATE' AND NEW IS DISTINCT FROM OLD) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.profile_audit_logs (
      profile_id,
      changed_by,
      changes,
      action_type
    ) VALUES (
      COALESCE(NEW.id, OLD.id),
      auth.uid(), -- This can be NULL now
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
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Now insert the missing profile
INSERT INTO public.profiles (id, first_name, last_name, role, approval_status, created_at, updated_at)
SELECT 
  '4fad7c5f-517a-46e4-8305-20df1fbd5d03',
  'Akshay',
  'Londhe',
  'tenant_manager'::app_role,
  'pending'::approval_status,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = '4fad7c5f-517a-46e4-8305-20df1fbd5d03');