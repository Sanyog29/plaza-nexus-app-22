-- Create service categories and items tables
CREATE TABLE public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.service_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  duration_minutes INTEGER,
  is_available BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service bookings table
CREATE TABLE public.service_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_item_id UUID REFERENCES public.service_items(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  total_amount NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create equipment table for facility management
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational',
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  warranty_expiry DATE,
  purchase_date DATE,
  purchase_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create file attachments table for requests
CREATE TABLE public.request_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_categories
CREATE POLICY "Anyone can view service categories" ON public.service_categories FOR SELECT USING (true);
CREATE POLICY "Only admins can modify service categories" ON public.service_categories FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for service_items
CREATE POLICY "Anyone can view service items" ON public.service_items FOR SELECT USING (true);
CREATE POLICY "Only admins can modify service items" ON public.service_items FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for service_bookings
CREATE POLICY "Users can view their own bookings" ON public.service_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookings" ON public.service_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.service_bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all bookings" ON public.service_bookings FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can update all bookings" ON public.service_bookings FOR UPDATE USING (is_staff(auth.uid()));

-- RLS Policies for equipment
CREATE POLICY "Staff can view all equipment" ON public.equipment FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Only admins can modify equipment" ON public.equipment FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for request_attachments
CREATE POLICY "Users can view attachments for their requests" ON public.request_attachments 
FOR SELECT USING ((SELECT reported_by FROM maintenance_requests WHERE id = request_id) = auth.uid());
CREATE POLICY "Staff can view all attachments" ON public.request_attachments FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Users can upload attachments to their requests" ON public.request_attachments 
FOR INSERT WITH CHECK ((SELECT reported_by FROM maintenance_requests WHERE id = request_id) = auth.uid() AND auth.uid() = uploaded_by);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_items_updated_at BEFORE UPDATE ON public.service_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial service categories
INSERT INTO public.service_categories (name, description, icon) VALUES
('Cleaning', 'Professional cleaning services', 'Sparkles'),
('Maintenance', 'Equipment and facility maintenance', 'Wrench'),
('Transport', 'Transportation and delivery services', 'Truck'),
('Security', 'Security and safety services', 'Shield');

-- Insert initial service items
INSERT INTO public.service_items (category_id, name, description, price, duration_minutes) VALUES
((SELECT id FROM service_categories WHERE name = 'Cleaning'), 'Deep Cleaning', 'Complete apartment deep cleaning service', 150.00, 180),
((SELECT id FROM service_categories WHERE name = 'Cleaning'), 'Regular Cleaning', 'Weekly apartment cleaning service', 80.00, 120),
((SELECT id FROM service_categories WHERE name = 'Maintenance'), 'AC Servicing', 'Air conditioning maintenance and cleaning', 120.00, 90),
((SELECT id FROM service_categories WHERE name = 'Maintenance'), 'Plumbing Repair', 'General plumbing repair services', 100.00, 60),
((SELECT id FROM service_categories WHERE name = 'Transport'), 'Grocery Delivery', 'Grocery shopping and delivery service', 25.00, 60),
((SELECT id FROM service_categories WHERE name = 'Security'), 'Security Escort', 'Personal security escort service', 50.00, 30);

-- Insert sample equipment data
INSERT INTO public.equipment (name, category, location, status, last_maintenance_date, next_maintenance_date) VALUES
('Elevator A', 'Vertical Transport', 'Building A - Main', 'operational', '2024-12-01', '2025-01-01'),
('Elevator B', 'Vertical Transport', 'Building B - Main', 'operational', '2024-12-01', '2025-01-01'),
('Generator', 'Power Systems', 'Basement - Utility Room', 'operational', '2024-11-15', '2024-12-15'),
('Water Pump 1', 'Water Systems', 'Basement - Pump Room', 'operational', '2024-11-20', '2024-12-20'),
('CCTV System', 'Security', 'Multiple Locations', 'operational', '2024-12-01', '2025-02-01'),
('Fire Safety System', 'Safety', 'All Floors', 'operational', '2024-10-15', '2025-01-15');