-- Add updated_at column to vendor_staff table
ALTER TABLE public.vendor_staff ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION public.update_vendor_staff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_staff_updated_at
  BEFORE UPDATE ON public.vendor_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_staff_updated_at();

-- Fix admin_add_vendor_staff RPC function
CREATE OR REPLACE FUNCTION public.admin_add_vendor_staff(
  p_user_id UUID,
  p_vendor_id UUID,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only administrators can assign vendor staff');
  END IF;

  -- Insert or update vendor staff assignment
  INSERT INTO public.vendor_staff (user_id, vendor_id, is_active, updated_at)
  VALUES (p_user_id, p_vendor_id, p_is_active, now())
  ON CONFLICT (user_id, vendor_id) 
  DO UPDATE SET 
    is_active = p_is_active,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'message', 'User assigned to vendor successfully');
END;
$$;