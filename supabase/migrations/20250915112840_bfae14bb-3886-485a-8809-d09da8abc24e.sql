-- Add storage bucket for vendor QR codes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-qr-codes', 'vendor-qr-codes', true);

-- Create storage policies for vendor QR codes
CREATE POLICY "Vendors can upload QR codes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'vendor-qr-codes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vendors can view their QR codes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vendor-qr-codes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vendors can update their QR codes" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'vendor-qr-codes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view vendor QR codes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vendor-qr-codes');