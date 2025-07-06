-- Create security guard shifts table
CREATE TABLE IF NOT EXISTS public.security_shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guard_id UUID NOT NULL REFERENCES public.profiles(id),
  shift_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  shift_end TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  handover_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visitor photos table
CREATE TABLE IF NOT EXISTS public.visitor_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('check_in', 'profile', 'id_verification')),
  captured_by UUID REFERENCES public.profiles(id),
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create visitor check-in logs table
CREATE TABLE IF NOT EXISTS public.visitor_check_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('check_in', 'check_out', 'badge_assigned', 'access_granted')),
  performed_by UUID REFERENCES public.profiles(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on new tables
ALTER TABLE public.security_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_check_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security shifts
CREATE POLICY "Guards can manage their own shifts" ON public.security_shifts
  FOR ALL USING (auth.uid() = guard_id);

CREATE POLICY "Staff can view all shifts" ON public.security_shifts
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage all shifts" ON public.security_shifts
  FOR ALL USING (is_admin(auth.uid()));

-- Create RLS policies for visitor photos
CREATE POLICY "Staff can manage visitor photos" ON public.visitor_photos
  FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Hosts can view photos of their visitors" ON public.visitor_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visitors v 
      WHERE v.id = visitor_photos.visitor_id 
      AND v.host_id = auth.uid()
    )
  );

-- Create RLS policies for visitor check logs
CREATE POLICY "Staff can manage check logs" ON public.visitor_check_logs
  FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Hosts can view logs of their visitors" ON public.visitor_check_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM visitors v 
      WHERE v.id = visitor_check_logs.visitor_id 
      AND v.host_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_security_shifts_updated_at
  BEFORE UPDATE ON public.security_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add storage bucket for visitor photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('visitor-photos', 'visitor-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for visitor photos
CREATE POLICY "Staff can upload visitor photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'visitor-photos' AND is_staff(auth.uid()));

CREATE POLICY "Staff can view visitor photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'visitor-photos' AND is_staff(auth.uid()));

CREATE POLICY "Staff can update visitor photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'visitor-photos' AND is_staff(auth.uid()));

-- Function to start a security shift
CREATE OR REPLACE FUNCTION public.start_security_shift()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  shift_id UUID;
  active_shifts INTEGER;
BEGIN
  -- Check if user is staff
  IF NOT is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only staff can start shifts';
  END IF;
  
  -- Check for active shifts
  SELECT COUNT(*) INTO active_shifts
  FROM security_shifts
  WHERE guard_id = auth.uid() AND shift_end IS NULL;
  
  IF active_shifts > 0 THEN
    RAISE EXCEPTION 'Guard already has an active shift';
  END IF;
  
  -- Create new shift
  INSERT INTO security_shifts (guard_id)
  VALUES (auth.uid())
  RETURNING id INTO shift_id;
  
  RETURN shift_id;
END;
$$;

-- Function to end a security shift
CREATE OR REPLACE FUNCTION public.end_security_shift(handover_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is staff
  IF NOT is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Only staff can end shifts';
  END IF;
  
  -- Update the active shift
  UPDATE security_shifts
  SET shift_end = now(),
      handover_notes = COALESCE(end_security_shift.handover_notes, handover_notes),
      updated_at = now()
  WHERE guard_id = auth.uid() AND shift_end IS NULL;
  
  RETURN FOUND;
END;
$$;