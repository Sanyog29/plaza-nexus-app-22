-- Add UPI payment configuration fields to vendors table for payment integration
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS upi_id TEXT,
ADD COLUMN IF NOT EXISTS payment_gateway_config JSONB DEFAULT '{}'::jsonb;

-- Update store_config to support UPI and payment configuration
COMMENT ON COLUMN public.vendors.upi_id IS 'Primary UPI ID for direct payments to vendor';
COMMENT ON COLUMN public.vendors.payment_gateway_config IS 'Configuration for payment gateway integration including UPI details, merchant info, etc.';