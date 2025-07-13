-- Create utility meters table for tracking different utility meters
CREATE TABLE public.utility_meters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meter_id TEXT NOT NULL UNIQUE,
  meter_type TEXT NOT NULL,
  location TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.utility_meters ENABLE ROW LEVEL SECURITY;

-- Create policies for utility meters
CREATE POLICY "Staff can view utility meters" 
ON public.utility_meters 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can manage utility meters" 
ON public.utility_meters 
FOR ALL 
USING (is_staff(auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on utility_meters
CREATE TRIGGER update_utility_meters_updated_at
BEFORE UPDATE ON public.utility_meters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample utility meters
INSERT INTO public.utility_meters (meter_id, meter_type, location) VALUES
('ELE-001', 'electricity', 'Main Building - Floor 1'),
('ELE-002', 'electricity', 'Main Building - Floor 2'),
('ELE-003', 'electricity', 'Main Building - Floor 3'),
('WAT-001', 'water', 'Main Building - Kitchen'),
('WAT-002', 'water', 'Main Building - Restrooms'),
('GAS-001', 'gas', 'Main Building - Kitchen'),
('GAS-002', 'gas', 'Main Building - Heating System');