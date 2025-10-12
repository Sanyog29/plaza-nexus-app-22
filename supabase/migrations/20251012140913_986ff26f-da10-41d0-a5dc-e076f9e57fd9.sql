-- Add super_tenant role to app_role enum
-- Note: This must be done in a separate transaction before updating functions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'super_tenant' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
  ) THEN
    ALTER TYPE app_role ADD VALUE 'super_tenant';
  END IF;
END $$;