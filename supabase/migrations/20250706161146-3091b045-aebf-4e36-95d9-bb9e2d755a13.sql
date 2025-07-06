-- Create app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE app_role AS ENUM ('tenant', 'staff', 'admin', 'ops_l1', 'ops_l2', 'hk_security');
    END IF;
END $$;

-- Add operational metadata to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS floor TEXT,
ADD COLUMN IF NOT EXISTS zone TEXT,  
ADD COLUMN IF NOT EXISTS department TEXT;

-- Create staff attendance tracking table
CREATE TABLE IF NOT EXISTS public.staff_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  zone_qr_code TEXT NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  location TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily checklists table
CREATE TABLE IF NOT EXISTS public.daily_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  checklist_type TEXT NOT NULL, -- 'ac_maintenance', 'cleaning', 'security'
  zone TEXT NOT NULL,
  checklist_items JSONB NOT NULL DEFAULT '[]', -- Array of checklist items with status
  photo_urls TEXT[],
  completion_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'approved'
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create zone QR codes table
CREATE TABLE IF NOT EXISTS public.zone_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name TEXT NOT NULL UNIQUE,
  floor TEXT NOT NULL,
  qr_code_data TEXT NOT NULL,
  location_description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zone_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_attendance
CREATE POLICY "Staff can view their own attendance" ON public.staff_attendance
  FOR SELECT USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can create their own attendance" ON public.staff_attendance
  FOR INSERT WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Staff can update their own attendance" ON public.staff_attendance
  FOR UPDATE USING (auth.uid() = staff_id OR is_staff(auth.uid()));

-- RLS Policies for daily_checklists
CREATE POLICY "Staff can view their own checklists" ON public.daily_checklists
  FOR SELECT USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can create their own checklists" ON public.daily_checklists
  FOR INSERT WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Staff can update their own checklists" ON public.daily_checklists
  FOR UPDATE USING (auth.uid() = staff_id OR is_staff(auth.uid()));

-- RLS Policies for zone_qr_codes
CREATE POLICY "Everyone can view active QR zones" ON public.zone_qr_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage QR zones" ON public.zone_qr_codes
  FOR ALL USING (is_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_staff_attendance_updated_at
  BEFORE UPDATE ON public.staff_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_checklists_updated_at
  BEFORE UPDATE ON public.daily_checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_zone_qr_codes_updated_at
  BEFORE UPDATE ON public.zone_qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has operational role
CREATE OR REPLACE FUNCTION public.is_ops_staff(uid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = $1 AND role IN ('ops_l1', 'ops_l2', 'admin', 'staff')
  );
$$;

-- Insert sample zone QR codes
INSERT INTO public.zone_qr_codes (zone_name, floor, qr_code_data, location_description) VALUES
('lobby_main', 'ground', '{"zone":"lobby_main","floor":"ground","type":"attendance"}', 'Main Lobby Reception'),
('floor_1_east', '1', '{"zone":"floor_1_east","floor":"1","type":"attendance"}', 'Floor 1 East Wing'),
('floor_1_west', '1', '{"zone":"floor_1_west","floor":"1","type":"attendance"}', 'Floor 1 West Wing'),
('basement_utilities', 'basement', '{"zone":"basement_utilities","floor":"basement","type":"attendance"}', 'Basement Utility Area');