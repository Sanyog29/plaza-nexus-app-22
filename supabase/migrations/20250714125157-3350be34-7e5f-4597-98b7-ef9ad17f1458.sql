-- Create services marketplace tables

-- Service categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Service providers
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_bookings INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  business_hours JSONB DEFAULT '{"monday": {"open": "09:00", "close": "17:00"}, "tuesday": {"open": "09:00", "close": "17:00"}, "wednesday": {"open": "09:00", "close": "17:00"}, "thursday": {"open": "09:00", "close": "17:00"}, "friday": {"open": "09:00", "close": "17:00"}, "saturday": {"closed": true}, "sunday": {"closed": true}}'::jsonb,
  specializations TEXT[],
  certifications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.service_categories(id),
  provider_id UUID REFERENCES public.service_providers(id),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) DEFAULT 0.00,
  duration_minutes INTEGER DEFAULT 60,
  is_available BOOLEAN DEFAULT true,
  booking_lead_time_hours INTEGER DEFAULT 24,
  max_advance_booking_days INTEGER DEFAULT 30,
  requires_approval BOOLEAN DEFAULT false,
  cancellation_policy TEXT,
  image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Service bookings
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.services(id),
  user_id UUID NOT NULL,
  provider_id UUID REFERENCES public.service_providers(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected')),
  notes TEXT,
  special_requirements TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(service_id, booking_date, start_time)
);

-- Service reviews
CREATE TABLE IF NOT EXISTS public.service_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.service_bookings(id),
  service_id UUID REFERENCES public.services(id),
  provider_id UUID REFERENCES public.service_providers(id),
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(booking_id, user_id)
);

-- Provider availability
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES public.service_providers(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(provider_id, date, start_time)
);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service categories - public read
CREATE POLICY "Anyone can view active service categories" ON public.service_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage service categories" ON public.service_categories
  FOR ALL USING (is_admin(auth.uid()));

-- Service providers - public read, admin manage
CREATE POLICY "Anyone can view active service providers" ON public.service_providers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage service providers" ON public.service_providers
  FOR ALL USING (is_admin(auth.uid()));

-- Services - public read, admin manage
CREATE POLICY "Anyone can view available services" ON public.services
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (is_admin(auth.uid()));

-- Service bookings - users can manage their own
CREATE POLICY "Users can view their own bookings" ON public.service_bookings
  FOR SELECT USING (auth.uid() = user_id OR is_staff(auth.uid()));

CREATE POLICY "Users can create their own bookings" ON public.service_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.service_bookings
  FOR UPDATE USING (auth.uid() = user_id OR is_staff(auth.uid()));

CREATE POLICY "Staff can manage all bookings" ON public.service_bookings
  FOR ALL USING (is_staff(auth.uid()));

-- Service reviews - users can review their completed bookings
CREATE POLICY "Anyone can view service reviews" ON public.service_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews for their completed bookings" ON public.service_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.service_bookings 
      WHERE id = service_reviews.booking_id 
      AND user_id = auth.uid() 
      AND status = 'completed'
    )
  );

CREATE POLICY "Users can update their own reviews" ON public.service_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Provider availability - staff can manage
CREATE POLICY "Anyone can view provider availability" ON public.provider_availability
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage provider availability" ON public.provider_availability
  FOR ALL USING (is_staff(auth.uid()));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_categories_updated_at BEFORE UPDATE ON public.service_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON public.service_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_reviews_updated_at BEFORE UPDATE ON public.service_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.service_categories (name, description, icon, color) VALUES
('Maintenance', 'General maintenance and repair services', 'wrench', '#3B82F6'),
('Cleaning', 'Professional cleaning services', 'sparkles', '#10B981'),
('IT Support', 'Technology and computer support', 'laptop', '#6366F1'),
('Health & Wellness', 'Health and wellness services', 'heart', '#EC4899'),
('Security', 'Security and safety services', 'shield', '#F59E0B'),
('Consulting', 'Business and professional consulting', 'briefcase', '#8B5CF6');

INSERT INTO public.service_providers (name, description, contact_email, contact_phone, specializations, certifications) VALUES
('TechFix Solutions', 'Professional IT support and computer repair services', 'contact@techfix.com', '+1-555-0101', ARRAY['Hardware Repair', 'Software Installation', 'Network Setup'], ARRAY['CompTIA A+', 'Microsoft Certified']),
('CleanPro Services', 'Professional cleaning services for offices and facilities', 'info@cleanpro.com', '+1-555-0102', ARRAY['Office Cleaning', 'Deep Cleaning', 'Carpet Cleaning'], ARRAY['ISSA Certified', 'Green Cleaning Certified']),
('SecureGuard', 'Comprehensive security solutions and services', 'security@secureguard.com', '+1-555-0103', ARRAY['Access Control', 'CCTV Installation', 'Security Audits'], ARRAY['Licensed Security', 'ASIS Certified']);

-- Insert sample services
INSERT INTO public.services (category_id, provider_id, name, description, base_price, duration_minutes, booking_lead_time_hours, requires_approval) VALUES
((SELECT id FROM public.service_categories WHERE name = 'IT Support'), (SELECT id FROM public.service_providers WHERE name = 'TechFix Solutions'), 'Computer Repair', 'Professional computer repair and troubleshooting', 75.00, 120, 4, false),
((SELECT id FROM public.service_categories WHERE name = 'IT Support'), (SELECT id FROM public.service_providers WHERE name = 'TechFix Solutions'), 'Software Installation', 'Professional software installation and setup', 50.00, 60, 2, false),
((SELECT id FROM public.service_categories WHERE name = 'Cleaning'), (SELECT id FROM public.service_providers WHERE name = 'CleanPro Services'), 'Office Deep Clean', 'Comprehensive office cleaning service', 150.00, 240, 24, true),
((SELECT id FROM public.service_categories WHERE name = 'Security'), (SELECT id FROM public.service_providers WHERE name = 'SecureGuard'), 'Security Assessment', 'Comprehensive security audit and assessment', 200.00, 180, 48, true);