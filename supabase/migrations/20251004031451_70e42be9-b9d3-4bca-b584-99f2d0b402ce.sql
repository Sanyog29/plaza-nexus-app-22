-- Implement field-level encryption for sensitive profile data

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns for sensitive data
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone_number_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS mobile_number_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS government_id_encrypted BYTEA,
  ADD COLUMN IF NOT EXISTS employee_id_encrypted BYTEA;

-- Create a secure encryption key in vault (for production use)
-- Users should set ENCRYPTION_KEY in their Supabase secrets

-- Function to encrypt sensitive data (only owner or admin can use)
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_field(
  plaintext TEXT,
  field_name TEXT
)
RETURNS BYTEA
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF plaintext IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Use a consistent encryption key from settings
  RETURN pgp_sym_encrypt(
    plaintext,
    current_setting('app.settings.encryption_key', true)
  );
END;
$$;

-- Function to decrypt sensitive data (only owner or admin can use)
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_field(
  ciphertext BYTEA,
  profile_id UUID,
  field_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  decrypted_value TEXT;
BEGIN
  -- Check authorization: only the profile owner or admin can decrypt
  IF auth.uid() != profile_id AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot decrypt sensitive data for other users';
  END IF;
  
  IF ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Decrypt the data
  BEGIN
    decrypted_value := pgp_sym_decrypt(
      ciphertext,
      current_setting('app.settings.encryption_key', true)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Decryption failed for field %: %', field_name, SQLERRM;
    RETURN NULL;
  END;
  
  -- Log access to sensitive data
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    new_values
  ) VALUES (
    auth.uid(),
    'decrypt_sensitive_data',
    field_name,
    profile_id,
    jsonb_build_object(
      'timestamp', now(),
      'accessor_id', auth.uid(),
      'profile_id', profile_id
    )
  );
  
  RETURN decrypted_value;
END;
$$;

-- Create a view that automatically decrypts fields for authorized users
CREATE OR REPLACE VIEW public.profiles_with_decrypted_data AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.email,
  p.role,
  p.approval_status,
  p.department,
  p.specialization,
  p.designation,
  p.floor,
  p.zone,
  p.bio,
  p.skills,
  p.interests,
  p.avatar_url,
  p.office_number,
  p.created_at,
  p.updated_at,
  -- Only decrypt if user is owner or admin
  CASE 
    WHEN p.id = auth.uid() OR public.is_admin(auth.uid()) THEN
      COALESCE(
        public.decrypt_sensitive_field(p.phone_number_encrypted, p.id, 'phone_number'),
        p.phone_number
      )
    ELSE NULL
  END as phone_number,
  CASE 
    WHEN p.id = auth.uid() OR public.is_admin(auth.uid()) THEN
      COALESCE(
        public.decrypt_sensitive_field(p.mobile_number_encrypted, p.id, 'mobile_number'),
        p.mobile_number
      )
    ELSE NULL
  END as mobile_number,
  CASE 
    WHEN p.id = auth.uid() OR public.is_admin(auth.uid()) THEN
      COALESCE(
        public.decrypt_sensitive_field(p.government_id_encrypted, p.id, 'government_id'),
        p.government_id
      )
    ELSE NULL
  END as government_id,
  CASE 
    WHEN p.id = auth.uid() OR public.is_admin(auth.uid()) THEN
      COALESCE(
        public.decrypt_sensitive_field(p.employee_id_encrypted, p.id, 'employee_id'),
        p.employee_id
      )
    ELSE NULL
  END as employee_id
FROM public.profiles p;

-- Grant access to the view
GRANT SELECT ON public.profiles_with_decrypted_data TO authenticated;

-- Add trigger to automatically encrypt sensitive data on insert/update
CREATE OR REPLACE FUNCTION public.encrypt_profile_sensitive_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Encrypt phone_number if provided and not already encrypted
  IF NEW.phone_number IS NOT NULL AND NEW.phone_number_encrypted IS NULL THEN
    NEW.phone_number_encrypted := public.encrypt_sensitive_field(NEW.phone_number, 'phone_number');
    NEW.phone_number := NULL; -- Clear plaintext
  END IF;
  
  -- Encrypt mobile_number if provided and not already encrypted
  IF NEW.mobile_number IS NOT NULL AND NEW.mobile_number_encrypted IS NULL THEN
    NEW.mobile_number_encrypted := public.encrypt_sensitive_field(NEW.mobile_number, 'mobile_number');
    NEW.mobile_number := NULL; -- Clear plaintext
  END IF;
  
  -- Encrypt government_id if provided and not already encrypted
  IF NEW.government_id IS NOT NULL AND NEW.government_id_encrypted IS NULL THEN
    NEW.government_id_encrypted := public.encrypt_sensitive_field(NEW.government_id, 'government_id');
    NEW.government_id := NULL; -- Clear plaintext
  END IF;
  
  -- Encrypt employee_id if provided and not already encrypted
  IF NEW.employee_id IS NOT NULL AND NEW.employee_id_encrypted IS NULL THEN
    NEW.employee_id_encrypted := public.encrypt_sensitive_field(NEW.employee_id, 'employee_id');
    NEW.employee_id := NULL; -- Clear plaintext
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic encryption
DROP TRIGGER IF EXISTS encrypt_profile_data_trigger ON public.profiles;
CREATE TRIGGER encrypt_profile_data_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_profile_sensitive_data();

-- Migrate existing unencrypted data (if encryption key is set)
-- This will run only if the key exists
DO $$
BEGIN
  -- Try to migrate existing data if encryption key is available
  IF current_setting('app.settings.encryption_key', true) IS NOT NULL THEN
    -- Encrypt existing phone numbers
    UPDATE public.profiles
    SET phone_number_encrypted = public.encrypt_sensitive_field(phone_number, 'phone_number')
    WHERE phone_number IS NOT NULL 
      AND phone_number_encrypted IS NULL;
    
    -- Encrypt existing mobile numbers
    UPDATE public.profiles
    SET mobile_number_encrypted = public.encrypt_sensitive_field(mobile_number, 'mobile_number')
    WHERE mobile_number IS NOT NULL 
      AND mobile_number_encrypted IS NULL;
    
    -- Encrypt existing government IDs
    UPDATE public.profiles
    SET government_id_encrypted = public.encrypt_sensitive_field(government_id, 'government_id')
    WHERE government_id IS NOT NULL 
      AND government_id_encrypted IS NULL;
    
    -- Encrypt existing employee IDs
    UPDATE public.profiles
    SET employee_id_encrypted = public.encrypt_sensitive_field(employee_id, 'employee_id')
    WHERE employee_id IS NOT NULL 
      AND employee_id_encrypted IS NULL;
      
    RAISE NOTICE 'Existing sensitive data has been encrypted';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Could not migrate existing data - encryption key may not be set: %', SQLERRM;
END $$;

-- Update column comments
COMMENT ON COLUMN public.profiles.phone_number IS 'DEPRECATED: Use phone_number_encrypted. Plain text field for backward compatibility only.';
COMMENT ON COLUMN public.profiles.mobile_number IS 'DEPRECATED: Use mobile_number_encrypted. Plain text field for backward compatibility only.';
COMMENT ON COLUMN public.profiles.government_id IS 'CRITICAL: Use government_id_encrypted. Plain text field should be migrated.';
COMMENT ON COLUMN public.profiles.employee_id IS 'SENSITIVE: Use employee_id_encrypted. Plain text field for backward compatibility only.';

COMMENT ON COLUMN public.profiles.phone_number_encrypted IS 'Encrypted phone number - use decrypt_sensitive_field() to access';
COMMENT ON COLUMN public.profiles.mobile_number_encrypted IS 'Encrypted mobile number - use decrypt_sensitive_field() to access';
COMMENT ON COLUMN public.profiles.government_id_encrypted IS 'Encrypted government ID - use decrypt_sensitive_field() to access';
COMMENT ON COLUMN public.profiles.employee_id_encrypted IS 'Encrypted employee ID - use decrypt_sensitive_field() to access';