-- Create info hub categories for organizing content
CREATE TABLE public.info_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create info items table for documents, floor plans, contacts, guidelines
CREATE TABLE public.info_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.info_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  file_url TEXT,
  file_size TEXT,
  file_type TEXT,
  image_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_role TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.info_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for info_categories
CREATE POLICY "Anyone can view info categories" ON public.info_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify info categories" ON public.info_categories
  FOR ALL USING (is_admin(auth.uid()));

-- Create RLS policies for info_items  
CREATE POLICY "Anyone can view info items" ON public.info_items
  FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify info items" ON public.info_items
  FOR ALL USING (is_admin(auth.uid()));

-- Add updated_at trigger for both tables
CREATE TRIGGER update_info_categories_updated_at
  BEFORE UPDATE ON public.info_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_info_items_updated_at
  BEFORE UPDATE ON public.info_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample categories
INSERT INTO public.info_categories (name, description, icon, display_order) VALUES
('floor_plans', 'Building floor plans and layouts', 'building', 1),
('contacts', 'Important contact information for building staff', 'user', 2),
('resources', 'Downloadable documents and forms', 'hard-drive', 3),
('guidelines', 'Building policies and procedures', 'map', 4);

-- Insert sample data for floor plans
INSERT INTO public.info_items (category_id, title, description, image_url, file_url, display_order) 
SELECT 
  c.id,
  'Ground Floor Plan',
  'Main lobby, security desk, and ground floor tenants',
  '/placeholder.svg',
  '#',
  1
FROM public.info_categories c WHERE c.name = 'floor_plans';

INSERT INTO public.info_items (category_id, title, description, image_url, file_url, display_order) 
SELECT 
  c.id,
  '1st Floor Plan',
  'Commercial offices and meeting rooms',
  '/placeholder.svg',
  '#',
  2
FROM public.info_categories c WHERE c.name = 'floor_plans';

-- Insert sample contacts
INSERT INTO public.info_items (category_id, title, description, contact_role, contact_email, contact_phone, display_order) 
SELECT 
  c.id,
  'Rajesh Kumar',
  'Building Manager',
  'Building Manager',
  'rajesh.kumar@ssplaza.com',
  '+91-9876543210',
  1
FROM public.info_categories c WHERE c.name = 'contacts';

INSERT INTO public.info_items (category_id, title, description, contact_role, contact_email, contact_phone, display_order) 
SELECT 
  c.id,
  'Priya Sharma',
  'Security Manager',
  'Security Manager', 
  'priya.sharma@ssplaza.com',
  '+91-9876543211',
  2
FROM public.info_categories c WHERE c.name = 'contacts';

-- Insert sample resources
INSERT INTO public.info_items (category_id, title, description, file_type, file_size, file_url, display_order) 
SELECT 
  c.id,
  'Building User Manual',
  'Complete guide for SS Plaza tenants',
  'PDF',
  '2.4 MB',
  '#',
  1
FROM public.info_categories c WHERE c.name = 'resources';

INSERT INTO public.info_items (category_id, title, description, file_type, file_size, file_url, display_order) 
SELECT 
  c.id,
  'Visitor Policy Document',
  'Official visitor registration and security policies',
  'PDF', 
  '1.2 MB',
  '#',
  2
FROM public.info_categories c WHERE c.name = 'resources';

-- Insert sample guidelines
INSERT INTO public.info_items (category_id, title, content, display_order) 
SELECT 
  c.id,
  'Office Hours',
  'Building operational hours are from 8:00 AM to 8:00 PM on weekdays, and 10:00 AM to 6:00 PM on weekends.',
  1
FROM public.info_categories c WHERE c.name = 'guidelines';

INSERT INTO public.info_items (category_id, title, content, display_order) 
SELECT 
  c.id,
  'Visitor Registration Policy',
  'All visitors must register at the security desk in the main lobby. Visitors are required to show valid ID and must be accompanied by their host at all times.',
  2
FROM public.info_categories c WHERE c.name = 'guidelines';