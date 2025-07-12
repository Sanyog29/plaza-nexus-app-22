-- Create service providers table
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  specializations TEXT[],
  hourly_rate DECIMAL(10,2),
  availability_schedule JSONB DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0.0,
  total_completed_services INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  certification_documents TEXT[],
  background_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on service_providers
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_providers
CREATE POLICY "Anyone can view active service providers" 
ON public.service_providers FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage service providers" 
ON public.service_providers FOR ALL 
USING (is_admin(auth.uid()));

CREATE POLICY "Providers can update their own profile" 
ON public.service_providers FOR UPDATE 
USING (auth.uid() = user_id);

-- Add service_provider_id to service_bookings
ALTER TABLE public.service_bookings 
ADD COLUMN IF NOT EXISTS service_provider_id UUID REFERENCES public.service_providers(id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS review_text TEXT;

-- Create trigger for updated_at
CREATE OR REPLACE TRIGGER update_service_providers_updated_at
BEFORE UPDATE ON public.service_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON public.service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_active ON public.service_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_service_bookings_provider ON public.service_bookings(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON public.service_bookings(status);