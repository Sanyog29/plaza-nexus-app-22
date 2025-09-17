-- Fix RLS policies for vendor-qr-codes storage bucket
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Vendor staff can upload their QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Vendor staff can update their QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Vendor staff can delete their QR codes" ON storage.objects;

-- Create more flexible policies using proper vendor staff validation
CREATE POLICY "Vendor staff can upload QR codes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-qr-codes' AND
  (
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM vendor_staff vs
      WHERE vs.user_id = auth.uid() 
      AND vs.is_active = true
      AND (storage.foldername(name))[1] = vs.vendor_id::text
    )
  )
);

CREATE POLICY "Vendor staff can update QR codes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vendor-qr-codes' AND
  (
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM vendor_staff vs
      WHERE vs.user_id = auth.uid() 
      AND vs.is_active = true
      AND (storage.foldername(name))[1] = vs.vendor_id::text
    )
  )
);

CREATE POLICY "Vendor staff can delete QR codes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor-qr-codes' AND
  (
    is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM vendor_staff vs
      WHERE vs.user_id = auth.uid() 
      AND vs.is_active = true
      AND (storage.foldername(name))[1] = vs.vendor_id::text
    )
  )
);

-- Update set_vendor_qr function to be more robust
CREATE OR REPLACE FUNCTION public.set_vendor_qr(
  p_vendor_id UUID,
  p_custom_qr_url TEXT DEFAULT NULL,
  p_use_custom BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin or vendor staff for this vendor
  IF NOT (
    is_admin(auth.uid()) OR 
    is_vendor_staff_for_vendor(auth.uid(), p_vendor_id)
  ) THEN
    RAISE EXCEPTION 'Access denied: Not authorized to manage this vendor';
  END IF;

  -- Update vendor store_config
  UPDATE vendors 
  SET store_config = COALESCE(store_config, '{}'::jsonb) || 
    jsonb_build_object(
      'custom_qr_url', p_custom_qr_url,
      'use_custom_qr', p_use_custom,
      'qr_updated_at', now()
    )
  WHERE id = p_vendor_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor not found: %', p_vendor_id;
  END IF;

  RETURN TRUE;
END;
$$;