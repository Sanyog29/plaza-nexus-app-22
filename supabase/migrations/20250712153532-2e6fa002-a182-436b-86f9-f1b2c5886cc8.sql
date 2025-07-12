-- Add foreign key constraint to link service_bookings to profiles
ALTER TABLE public.service_bookings 
ADD CONSTRAINT fk_service_bookings_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add foreign key constraint to link service_bookings to service_providers  
ALTER TABLE public.service_bookings 
ADD CONSTRAINT fk_service_bookings_service_provider_id 
FOREIGN KEY (service_provider_id) REFERENCES public.service_providers(id) ON DELETE SET NULL;