-- Fix priority type casting issue
-- Create a trigger function to ensure proper priority casting
CREATE OR REPLACE FUNCTION public.cast_request_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure priority is properly cast to request_priority enum
  IF NEW.priority IS NOT NULL THEN
    NEW.priority := NEW.priority::request_priority;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for maintenance_requests
DROP TRIGGER IF EXISTS cast_priority_trigger ON public.maintenance_requests;
CREATE TRIGGER cast_priority_trigger
  BEFORE INSERT OR UPDATE ON public.maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION public.cast_request_priority();

-- Create storage bucket for maintenance attachments if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'maintenance-attachments',
  'maintenance-attachments',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for maintenance attachments bucket
CREATE POLICY "Authenticated users can upload maintenance attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view maintenance attachments they uploaded"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'maintenance-attachments' 
  AND (auth.uid()::text = (storage.foldername(name))[1] OR is_staff(auth.uid()))
);

CREATE POLICY "Users can delete their own maintenance attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'maintenance-attachments' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);