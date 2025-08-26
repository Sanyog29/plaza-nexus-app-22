-- Check and add columns that don't exist yet
DO $$
BEGIN
  -- Add employee_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'employee_id') THEN
    ALTER TABLE public.profiles ADD COLUMN employee_id TEXT;
  END IF;
  
  -- Add designation if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'designation') THEN
    ALTER TABLE public.profiles ADD COLUMN designation TEXT;
  END IF;
  
  -- Add supervisor_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'supervisor_id') THEN
    ALTER TABLE public.profiles ADD COLUMN supervisor_id UUID REFERENCES public.profiles(id);
  END IF;
  
  -- Add shift_start if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'shift_start') THEN
    ALTER TABLE public.profiles ADD COLUMN shift_start TIME;
  END IF;
  
  -- Add shift_end if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'shift_end') THEN
    ALTER TABLE public.profiles ADD COLUMN shift_end TIME;
  END IF;
  
  -- Add government_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'government_id') THEN
    ALTER TABLE public.profiles ADD COLUMN government_id TEXT;
  END IF;
  
  -- Add onboarding_date if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_date') THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_date DATE DEFAULT CURRENT_DATE;
  END IF;
  
  -- Add is_active if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_active') THEN
    ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
  
  -- Add avatar_url if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Create operational departments table
CREATE TABLE IF NOT EXISTS public.operational_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department_head_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operational zones table
CREATE TABLE IF NOT EXISTS public.operational_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name TEXT NOT NULL,
  zone_code TEXT UNIQUE,
  department_id UUID REFERENCES public.operational_departments(id),
  floor TEXT,
  building TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff area assignments table
CREATE TABLE IF NOT EXISTS public.staff_area_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES public.operational_zones(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.operational_departments(id),
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, zone_id)
);

-- Create skills master table
CREATE TABLE IF NOT EXISTS public.skills_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certifications master table
CREATE TABLE IF NOT EXISTS public.certifications_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certification_name TEXT NOT NULL,
  issuing_authority TEXT,
  validity_months INTEGER,
  is_mandatory BOOLEAN DEFAULT false,
  skill_category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff skills table
CREATE TABLE IF NOT EXISTS public.staff_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills_master(id),
  proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  acquired_date DATE,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, skill_id)
);

-- Create staff certifications table
CREATE TABLE IF NOT EXISTS public.staff_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certification_id UUID NOT NULL REFERENCES public.certifications_master(id),
  certification_number TEXT,
  issued_date DATE,
  expiry_date DATE,
  issuing_authority TEXT,
  document_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.operational_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_area_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_certifications ENABLE ROW LEVEL SECURITY;

-- Function to assign staff to zones
CREATE OR REPLACE FUNCTION public.assign_staff_to_zone(
  p_staff_id UUID,
  p_zone_id UUID,
  p_department_id UUID,
  p_is_primary BOOLEAN DEFAULT false
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assignment_id UUID;
  caller_role TEXT;
BEGIN
  -- Check if caller is admin or ops_supervisor
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF caller_role NOT IN ('admin', 'ops_supervisor') THEN
    RAISE EXCEPTION 'Only administrators and ops supervisors can assign staff to zones';
  END IF;
  
  -- If this is set as primary, remove primary status from other assignments
  IF p_is_primary THEN
    UPDATE public.staff_area_assignments 
    SET is_primary = false 
    WHERE staff_id = p_staff_id AND is_primary = true;
  END IF;
  
  -- Insert or update assignment
  INSERT INTO public.staff_area_assignments (
    staff_id, zone_id, department_id, assigned_by, is_primary
  ) VALUES (
    p_staff_id, p_zone_id, p_department_id, auth.uid(), p_is_primary
  ) 
  ON CONFLICT (staff_id, zone_id) 
  DO UPDATE SET
    department_id = EXCLUDED.department_id,
    assigned_by = EXCLUDED.assigned_by,
    is_primary = EXCLUDED.is_primary,
    assigned_at = now(),
    is_active = true,
    updated_at = now()
  RETURNING id INTO assignment_id;
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (
    auth.uid(), 
    'assign_staff_to_zone', 
    'staff_area_assignment', 
    assignment_id,
    jsonb_build_object(
      'staff_id', p_staff_id,
      'zone_id', p_zone_id,
      'department_id', p_department_id,
      'is_primary', p_is_primary
    )
  );
  
  RETURN assignment_id;
END;
$$;

-- Insert default departments if they don't exist
INSERT INTO public.operational_departments (name, description) 
SELECT * FROM (VALUES
  ('MST/Field Staff', 'Maintenance and Technical Services'),
  ('Housekeeping', 'Cleaning and Facility Maintenance'),
  ('Security', 'Security and Access Control'),
  ('Operations', 'General Operations and Support')
) AS t(name, description)
WHERE NOT EXISTS (SELECT 1 FROM public.operational_departments WHERE name = t.name);

-- Insert default skills if they don't exist
INSERT INTO public.skills_master (skill_name, category) 
SELECT * FROM (VALUES
  ('Electrical Work', 'Technical'),
  ('Plumbing', 'Technical'),
  ('HVAC Systems', 'Technical'),
  ('Carpentry', 'Technical'),
  ('Cleaning Techniques', 'Housekeeping'),
  ('Floor Care', 'Housekeeping'),
  ('Waste Management', 'Housekeeping'),
  ('Security Protocols', 'Security'),
  ('Access Control Systems', 'Security'),
  ('Emergency Response', 'Security'),
  ('Safety Procedures', 'General'),
  ('Equipment Operation', 'General')
) AS t(skill_name, category)
WHERE NOT EXISTS (SELECT 1 FROM public.skills_master WHERE skill_name = t.skill_name);