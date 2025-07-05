-- Create storage bucket for maintenance request attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('maintenance-attachments', 'maintenance-attachments', true);

-- Create storage policies for maintenance attachments
CREATE POLICY "Users can upload attachments to their requests" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view attachments for their requests" ON storage.objects
FOR SELECT USING (
  bucket_id = 'maintenance-attachments' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1] 
    OR is_staff(auth.uid())
  )
);

CREATE POLICY "Staff can view all maintenance attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'maintenance-attachments' 
  AND is_staff(auth.uid())
);

CREATE POLICY "Users can delete their own attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);