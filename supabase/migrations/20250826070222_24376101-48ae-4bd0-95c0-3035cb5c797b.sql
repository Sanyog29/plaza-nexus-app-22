-- Extend profiles table with L1-specific fields
ALTER TABLE public.profiles 
ADD COLUMN employee_id TEXT,
ADD COLUMN designation TEXT,
ADD COLUMN supervisor_id UUID REFERENCES public.profiles(id),
ADD COLUMN shift_start TIME,
ADD COLUMN shift_end TIME,
ADD COLUMN emergency_contact_name TEXT,
ADD COLUMN emergency_contact_phone TEXT,
ADD COLUMN government_id TEXT,
ADD COLUMN onboarding_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN is_active BOOLEAN DEFAULT true,
ADD COLUMN avatar_url TEXT;

-- Create operational departments table
CREATE TABLE public.operational_departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  department_head_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create operational zones table
CREATE TABLE public.operational_zones (
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
CREATE TABLE public.staff_area_assignments (
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
CREATE TABLE public.skills_master (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  skill_name TEXT NOT NULL UNIQUE,
  category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certifications master table
CREATE TABLE public.certifications_master (
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
CREATE TABLE public.staff_skills (
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
CREATE TABLE public.staff_certifications (
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

-- RLS Policies for operational_departments
CREATE POLICY "Staff can view operational departments" 
ON public.operational_departments 
FOR SELECT 
USING (is_staff(auth.uid()) OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'field_staff'));

CREATE POLICY "Admins and ops supervisors can manage departments" 
ON public.operational_departments 
FOR ALL 
USING (is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ops_supervisor');

-- RLS Policies for operational_zones
CREATE POLICY "Staff can view operational zones" 
ON public.operational_zones 
FOR SELECT 
USING (is_staff(auth.uid()) OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'field_staff'));

CREATE POLICY "Admins and ops supervisors can manage zones" 
ON public.operational_zones 
FOR ALL 
USING (is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ops_supervisor');

-- RLS Policies for staff_area_assignments
CREATE POLICY "Staff can view their own assignments" 
ON public.staff_area_assignments 
FOR SELECT 
USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "L2+ can manage staff assignments" 
ON public.staff_area_assignments 
FOR ALL 
USING (is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ops_supervisor');

-- RLS Policies for skills_master
CREATE POLICY "Anyone can view skills master" 
ON public.skills_master 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage skills master" 
ON public.skills_master 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for certifications_master
CREATE POLICY "Anyone can view certifications master" 
ON public.certifications_master 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage certifications master" 
ON public.certifications_master 
FOR ALL 
USING (is_admin(auth.uid()));

-- RLS Policies for staff_skills
CREATE POLICY "Staff can view their own skills" 
ON public.staff_skills 
FOR SELECT 
USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can manage their own skills" 
ON public.staff_skills 
FOR INSERT 
WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "L2+ can manage all staff skills" 
ON public.staff_skills 
FOR ALL 
USING (is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ops_supervisor');

-- RLS Policies for staff_certifications
CREATE POLICY "Staff can view their own certifications" 
ON public.staff_certifications 
FOR SELECT 
USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can manage their own certifications" 
ON public.staff_certifications 
FOR INSERT 
WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "L2+ can manage all staff certifications" 
ON public.staff_certifications 
FOR ALL 
USING (is_admin(auth.uid()) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ops_supervisor');

-- Function to update L1 profile fields (for admin use)
CREATE OR REPLACE FUNCTION public.admin_update_l1_profile_fields(
  target_user_id UUID,
  profile_data JSONB
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Check if caller is admin or ops_supervisor
  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
  
  IF caller_role NOT IN ('admin', 'ops_supervisor') THEN
    RAISE EXCEPTION 'Only administrators and ops supervisors can update L1 profiles';
  END IF;
  
  -- Update profile with provided data
  UPDATE public.profiles 
  SET
    first_name = COALESCE(profile_data->>'first_name', first_name),
    last_name = COALESCE(profile_data->>'last_name', last_name),
    phone_number = COALESCE(profile_data->>'phone_number', phone_number),
    employee_id = COALESCE(profile_data->>'employee_id', employee_id),
    designation = COALESCE(profile_data->>'designation', designation),
    supervisor_id = CASE 
      WHEN profile_data ? 'supervisor_id' THEN (profile_data->>'supervisor_id')::UUID 
      ELSE supervisor_id 
    END,
    shift_start = CASE 
      WHEN profile_data ? 'shift_start' THEN (profile_data->>'shift_start')::TIME 
      ELSE shift_start 
    END,
    shift_end = CASE 
      WHEN profile_data ? 'shift_end' THEN (profile_data->>'shift_end')::TIME 
      ELSE shift_end 
    END,
    emergency_contact_name = COALESCE(profile_data->>'emergency_contact_name', emergency_contact_name),
    emergency_contact_phone = COALESCE(profile_data->>'emergency_contact_phone', emergency_contact_phone),
    government_id = COALESCE(profile_data->>'government_id', government_id),
    is_active = COALESCE((profile_data->>'is_active')::BOOLEAN, is_active),
    avatar_url = COALESCE(profile_data->>'avatar_url', avatar_url),
    updated_at = now()
  WHERE id = target_user_id;
  
  -- Log the action
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, new_values)
  VALUES (auth.uid(), 'update_l1_profile', 'profile', target_user_id, profile_data);
  
  RETURN FOUND;
END;
$$;

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

-- Insert default departments
INSERT INTO public.operational_departments (name, description) VALUES
  ('MST/Field Staff', 'Maintenance and Technical Services'),
  ('Housekeeping', 'Cleaning and Facility Maintenance'),
  ('Security', 'Security and Access Control'),
  ('Operations', 'General Operations and Support');

-- Insert default skills
INSERT INTO public.skills_master (skill_name, category) VALUES
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
  ('Equipment Operation', 'General');

-- Insert default certifications
INSERT INTO public.certifications_master (certification_name, issuing_authority, validity_months, skill_category) VALUES
  ('Electrical License', 'State Electrical Board', 24, 'Technical'),
  ('Plumbing License', 'State Plumbing Board', 24, 'Technical'),
  ('HVAC Certification', 'HVAC Institute', 36, 'Technical'),
  ('Safety Training Certificate', 'Safety Council', 12, 'General'),
  ('Security Guard License', 'Security Commission', 24, 'Security'),
  ('First Aid Certification', 'Red Cross', 24, 'General'),
  ('Housekeeping Standards', 'Facility Management Institute', 12, 'Housekeeping');

-- Create triggers for audit logging
CREATE OR REPLACE FUNCTION public.audit_staff_assignment_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
    VALUES (
      auth.uid(),
      'update_staff_assignment',
      'staff_area_assignment',
      NEW.id,
      row_to_json(OLD),
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, old_values)
    VALUES (
      auth.uid(),
      'delete_staff_assignment',
      'staff_area_assignment',
      OLD.id,
      row_to_json(OLD)
    );
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_staff_assignments
  AFTER UPDATE OR DELETE ON public.staff_area_assignments
  FOR EACH ROW EXECUTE FUNCTION public.audit_staff_assignment_changes();