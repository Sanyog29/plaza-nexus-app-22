-- Create storage bucket for maintenance photos
INSERT INTO storage.buckets (id, name, public) VALUES ('maintenance-photos', 'maintenance-photos', true);

-- Create policies for maintenance photos
CREATE POLICY "Maintenance photos are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'maintenance-photos');

CREATE POLICY "Staff can upload maintenance photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'maintenance-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update their maintenance photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'maintenance-photos' AND auth.uid() IS NOT NULL);