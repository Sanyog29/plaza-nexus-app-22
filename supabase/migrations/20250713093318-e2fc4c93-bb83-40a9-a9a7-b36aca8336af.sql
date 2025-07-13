-- Create utility readings table for tracking meter readings
CREATE TABLE public.utility_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id UUID NOT NULL REFERENCES public.utility_meters(id),
  reading_date DATE NOT NULL,
  reading_value DECIMAL(10,2) NOT NULL,
  consumption DECIMAL(10,2),
  cost_per_unit DECIMAL(10,4),
  total_cost DECIMAL(10,2),
  recorded_by UUID REFERENCES public.profiles(id),
  reading_method TEXT DEFAULT 'manual',
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meter_id, reading_date)
);

-- Enable Row Level Security
ALTER TABLE public.utility_readings ENABLE ROW LEVEL SECURITY;

-- Create policies for utility readings
CREATE POLICY "Staff can view utility readings" 
ON public.utility_readings 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can create utility readings" 
ON public.utility_readings 
FOR INSERT 
WITH CHECK (is_staff(auth.uid()));

-- Create trigger for automatic timestamp updates on utility_readings
CREATE TRIGGER update_utility_readings_updated_at
BEFORE UPDATE ON public.utility_readings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create staff attendance table
CREATE TABLE public.staff_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id),
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  break_start_time TIMESTAMP WITH TIME ZONE,
  break_end_time TIMESTAMP WITH TIME ZONE,
  total_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2),
  notes TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- Create policies for staff attendance
CREATE POLICY "Staff can view their own attendance" 
ON public.staff_attendance 
FOR SELECT 
USING (auth.uid() = staff_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can create their own attendance" 
ON public.staff_attendance 
FOR INSERT 
WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Staff can update their own attendance" 
ON public.staff_attendance 
FOR UPDATE 
USING (auth.uid() = staff_id OR is_staff(auth.uid()));

-- Create trigger for automatic timestamp updates on staff_attendance
CREATE TRIGGER update_staff_attendance_updated_at
BEFORE UPDATE ON public.staff_attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user performance scores table
CREATE TABLE public.user_performance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  metric_date DATE NOT NULL,
  efficiency_score DECIMAL(5,2) DEFAULT 0,
  quality_score DECIMAL(5,2) DEFAULT 0,
  reliability_score DECIMAL(5,2) DEFAULT 0,
  productivity_score DECIMAL(5,2) DEFAULT 0,
  customer_satisfaction_score DECIMAL(5,2) DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(8,2) DEFAULT 0,
  sla_compliance_rate DECIMAL(5,2) DEFAULT 0,
  attendance_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric_date)
);

-- Enable Row Level Security
ALTER TABLE public.user_performance_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for user performance scores
CREATE POLICY "Users can view their own performance scores" 
ON public.user_performance_scores 
FOR SELECT 
USING (auth.uid() = user_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can manage performance scores" 
ON public.user_performance_scores 
FOR ALL 
USING (is_staff(auth.uid()));

-- Create trigger for automatic timestamp updates on user_performance_scores
CREATE TRIGGER update_user_performance_scores_updated_at
BEFORE UPDATE ON public.user_performance_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();