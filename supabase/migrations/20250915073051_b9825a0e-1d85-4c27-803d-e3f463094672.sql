-- Create vendor-images storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-images', 'vendor-images', true);

-- Create RLS policies for vendor-images bucket
CREATE POLICY "Vendor images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'vendor-images');

CREATE POLICY "Vendor staff can upload images for their vendor" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'vendor-images' 
  AND EXISTS (
    SELECT 1 FROM public.vendor_staff 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Vendor staff can update images for their vendor" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'vendor-images' 
  AND EXISTS (
    SELECT 1 FROM public.vendor_staff 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);

CREATE POLICY "Vendor staff can delete images for their vendor" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'vendor-images' 
  AND EXISTS (
    SELECT 1 FROM public.vendor_staff 
    WHERE user_id = auth.uid() 
    AND is_active = true
  )
);