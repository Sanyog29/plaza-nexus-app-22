-- Create delivery management tables
CREATE TABLE public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT UNIQUE,
  recipient_name TEXT NOT NULL,
  recipient_company TEXT,
  recipient_contact TEXT,
  sender_name TEXT,
  sender_company TEXT,
  delivery_service TEXT,
  package_type TEXT DEFAULT 'package',
  package_description TEXT,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_time TIME,
  status TEXT NOT NULL DEFAULT 'pending',
  pickup_code TEXT,
  received_by UUID REFERENCES public.profiles(id),
  logged_by UUID REFERENCES public.profiles(id),
  pickup_at TIMESTAMP WITH TIME ZONE,
  pickup_by UUID REFERENCES public.profiles(id),
  special_instructions TEXT,
  photo_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Security staff can manage all deliveries"
  ON public.deliveries FOR ALL
  USING (is_staff(auth.uid()));

CREATE POLICY "Recipients can view their deliveries"
  ON public.deliveries FOR SELECT
  USING (
    recipient_name ILIKE '%' || (
      SELECT CONCAT(first_name, ' ', last_name) 
      FROM profiles 
      WHERE id = auth.uid()
    ) || '%'
    OR recipient_contact = (
      SELECT phone_number 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Create delivery notifications table
CREATE TABLE public.delivery_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  notification_type TEXT NOT NULL, -- 'arrival', 'pickup_reminder', 'ready_for_pickup'
  sent_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for delivery notifications
ALTER TABLE public.delivery_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their delivery notifications"
  ON public.delivery_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage delivery notifications"
  ON public.delivery_notifications FOR ALL
  USING (is_staff(auth.uid()));

-- Create function to generate pickup codes
CREATE OR REPLACE FUNCTION public.generate_pickup_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN UPPER(substring(md5(random()::text), 1, 6));
END;
$$;

-- Create trigger to generate pickup codes
CREATE OR REPLACE FUNCTION public.set_pickup_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pickup_code IS NULL THEN
    NEW.pickup_code := public.generate_pickup_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_pickup_code
  BEFORE INSERT ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.set_pickup_code();

-- Create updated_at trigger
CREATE TRIGGER trigger_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced visitor notifications
CREATE TABLE public.visitor_approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES public.profiles(id),
  approval_status TEXT DEFAULT 'pending',
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  response_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_approval_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can manage their visitor approvals"
  ON public.visitor_approval_requests FOR ALL
  USING (auth.uid() = host_user_id);

CREATE POLICY "Staff can view all visitor approvals"
  ON public.visitor_approval_requests FOR SELECT
  USING (is_staff(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER trigger_visitor_approval_requests_updated_at
  BEFORE UPDATE ON public.visitor_approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();