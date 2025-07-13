-- Create hot desking and dietary preferences tables
CREATE TABLE public.hot_desks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  desk_number TEXT NOT NULL UNIQUE,
  zone TEXT NOT NULL,
  floor TEXT NOT NULL,
  location_description TEXT,
  equipment_available TEXT[],
  amenities TEXT[],
  is_available BOOLEAN DEFAULT true,
  is_accessible BOOLEAN DEFAULT false,
  max_booking_duration_hours INTEGER DEFAULT 8,
  photo_url TEXT,
  coordinates_x DECIMAL,
  coordinates_y DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hot_desks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view available hot desks"
  ON public.hot_desks FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage hot desks"
  ON public.hot_desks FOR ALL
  USING (is_admin(auth.uid()));

-- Create hot desk bookings table
CREATE TABLE public.hot_desk_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  desk_id UUID NOT NULL REFERENCES public.hot_desks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  checked_in_at TIMESTAMP WITH TIME ZONE,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  auto_checkin BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(desk_id, booking_date, start_time, end_time)
);

-- Enable RLS
ALTER TABLE public.hot_desk_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own desk bookings"
  ON public.hot_desk_bookings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all desk bookings"
  ON public.hot_desk_bookings FOR SELECT
  USING (is_staff(auth.uid()));

-- Create dietary preferences table
CREATE TABLE public.dietary_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) UNIQUE,
  dietary_restrictions TEXT[],
  allergies TEXT[],
  preferred_cuisines TEXT[],
  spice_tolerance TEXT CHECK (spice_tolerance IN ('none', 'mild', 'medium', 'hot', 'very_hot')),
  meal_preferences JSONB,
  notification_preferences JSONB DEFAULT '{"new_items": true, "daily_specials": true, "allergen_alerts": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dietary_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own dietary preferences"
  ON public.dietary_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Create meal subscriptions table
CREATE TABLE public.meal_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id),
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('daily', 'weekly', 'monthly')),
  meal_types TEXT[] NOT NULL, -- breakfast, lunch, dinner, snacks
  preferred_items JSONB,
  max_daily_amount DECIMAL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  auto_order BOOLEAN DEFAULT true,
  delivery_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meal_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own meal subscriptions"
  ON public.meal_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Create enhanced room booking features
ALTER TABLE public.room_bookings 
ADD COLUMN catering_orders JSONB,
ADD COLUMN av_equipment_requests JSONB,
ADD COLUMN setup_requirements TEXT,
ADD COLUMN dietary_requirements TEXT[],
ADD COLUMN estimated_cost DECIMAL;

-- Create room equipment table
CREATE TABLE public.room_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id),
  equipment_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  is_available BOOLEAN DEFAULT true,
  requires_setup BOOLEAN DEFAULT false,
  setup_time_minutes INTEGER DEFAULT 15,
  usage_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.room_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view room equipment"
  ON public.room_equipment FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage room equipment"
  ON public.room_equipment FOR ALL
  USING (is_admin(auth.uid()));

-- Create updated_at triggers
CREATE TRIGGER trigger_hot_desks_updated_at
  BEFORE UPDATE ON public.hot_desks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_hot_desk_bookings_updated_at
  BEFORE UPDATE ON public.hot_desk_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_dietary_preferences_updated_at
  BEFORE UPDATE ON public.dietary_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_meal_subscriptions_updated_at
  BEFORE UPDATE ON public.meal_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample hot desk data
INSERT INTO public.hot_desks (desk_number, zone, floor, location_description, equipment_available, amenities, is_accessible) VALUES
('HD-001', 'North Wing', 'Ground Floor', 'Near main entrance', ARRAY['Monitor', 'Keyboard', 'Mouse', 'Docking Station'], ARRAY['Power Outlet', 'USB Hub', 'Phone'], false),
('HD-002', 'North Wing', 'Ground Floor', 'Window seat with city view', ARRAY['Monitor', 'Keyboard', 'Mouse'], ARRAY['Power Outlet', 'Natural Light'], false),
('HD-003', 'South Wing', '1st Floor', 'Quiet zone', ARRAY['Monitor', 'Keyboard', 'Mouse', 'Webcam'], ARRAY['Power Outlet', 'Noise Cancellation'], true),
('HD-004', 'Central', '2nd Floor', 'Collaboration area', ARRAY['Large Monitor', 'Keyboard', 'Mouse', 'Whiteboard'], ARRAY['Power Outlet', 'Meeting Space'], false),
('HD-005', 'East Wing', '3rd Floor', 'Executive area', ARRAY['Dual Monitor', 'Keyboard', 'Mouse', 'Docking Station', 'Phone'], ARRAY['Power Outlet', 'Privacy Screen'], false);