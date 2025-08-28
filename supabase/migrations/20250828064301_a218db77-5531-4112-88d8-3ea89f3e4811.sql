-- Create storage bucket for maintenance attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('maintenance-attachments', 'maintenance-attachments', true);

-- Create RLS policies for maintenance attachments bucket
CREATE POLICY "Public can view maintenance attachments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'maintenance-attachments');

CREATE POLICY "Authenticated users can upload maintenance attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own maintenance attachments" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own maintenance attachments" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);