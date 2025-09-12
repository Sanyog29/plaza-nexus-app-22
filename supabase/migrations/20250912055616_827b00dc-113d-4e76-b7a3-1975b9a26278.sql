-- Add vendor approval fields and enhance vendor table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_ifsc_code TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account_holder_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS store_config JSONB DEFAULT '{}';

-- Create vendor financial reports table
CREATE TABLE IF NOT EXISTS vendor_financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  commission_amount DECIMAL(10,2) DEFAULT 0,
  vendor_payout DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) DEFAULT 0,
  report_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on vendor_financial_reports
ALTER TABLE vendor_financial_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendor_financial_reports
CREATE POLICY "Vendors can view their own financial reports" ON vendor_financial_reports
FOR SELECT USING (
  vendor_id IN (
    SELECT vendor_id FROM vendor_staff 
    WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Admins can view all vendor financial reports" ON vendor_financial_reports
FOR ALL USING (is_admin(auth.uid()));

-- Create admin functions for vendor management
CREATE OR REPLACE FUNCTION admin_approve_vendor(target_vendor_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only administrators can approve vendors');
  END IF;
  
  -- Update vendor approval status
  UPDATE vendors 
  SET 
    approval_status = 'approved',
    approved_by = auth.uid(),
    approved_at = now(),
    is_active = true
  WHERE id = target_vendor_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Vendor not found');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Vendor approved successfully');
END;
$$;

CREATE OR REPLACE FUNCTION admin_reject_vendor(target_vendor_id UUID, reason TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only administrators can reject vendors');
  END IF;
  
  -- Update vendor approval status
  UPDATE vendors 
  SET 
    approval_status = 'rejected',
    approved_by = auth.uid(),
    approved_at = now(),
    rejection_reason = reason,
    is_active = false
  WHERE id = target_vendor_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Vendor not found');
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Vendor rejected successfully');
END;
$$;

CREATE OR REPLACE FUNCTION admin_create_vendor(vendor_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_vendor_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RETURN jsonb_build_object('error', 'Only administrators can create vendors');
  END IF;
  
  -- Insert new vendor
  INSERT INTO vendors (
    name, description, cuisine_type, stall_location, contact_email, contact_phone,
    commission_rate, operating_hours, logo_url, bank_account_number, bank_ifsc_code,
    bank_account_holder_name, gst_number, pan_number, approval_status
  ) VALUES (
    vendor_data->>'name',
    vendor_data->>'description', 
    vendor_data->>'cuisine_type',
    vendor_data->>'stall_location',
    vendor_data->>'contact_email',
    vendor_data->>'contact_phone',
    COALESCE((vendor_data->>'commission_rate')::DECIMAL, 15.0),
    COALESCE(vendor_data->'operating_hours', '{}'),
    vendor_data->>'logo_url',
    vendor_data->>'bank_account_number',
    vendor_data->>'bank_ifsc_code', 
    vendor_data->>'bank_account_holder_name',
    vendor_data->>'gst_number',
    vendor_data->>'pan_number',
    'pending'
  ) RETURNING id INTO new_vendor_id;
  
  RETURN jsonb_build_object('success', true, 'vendor_id', new_vendor_id);
END;
$$;