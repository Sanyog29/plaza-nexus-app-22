-- Check if issue_type column exists, add it if it doesn't
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'maintenance_requests' 
                   AND column_name = 'issue_type'
                   AND table_schema = 'public') THEN
        ALTER TABLE public.maintenance_requests ADD COLUMN issue_type TEXT;
    END IF;
END $$;

-- Update existing records to set a default issue type if null
UPDATE public.maintenance_requests 
SET issue_type = 'Legacy issue'
WHERE issue_type IS NULL;

-- Create index on issue_type column for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_issue_type ON public.maintenance_requests(issue_type);