-- Add new fields to profiles table for enhanced profile management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS floor TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'internal', 'private'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"maintenance": true, "announcements": true, "security": true, "events": false, "marketing": false}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS interests TEXT[];

-- Add audit trail table for profile changes
CREATE TABLE IF NOT EXISTS public.profile_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.profiles(id),
  changes JSONB NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on audit logs
ALTER TABLE public.profile_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit logs
CREATE POLICY "Users can view their own profile audit logs" 
ON public.profile_audit_logs 
FOR SELECT 
USING (profile_id = auth.uid() OR is_admin(auth.uid()));

-- Create function to track profile changes
CREATE OR REPLACE FUNCTION public.track_profile_changes()
RETURNS TRIGGER AS $$
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
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile audit logging
DROP TRIGGER IF EXISTS profile_audit_trigger ON public.profiles;
CREATE TRIGGER profile_audit_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.track_profile_changes();