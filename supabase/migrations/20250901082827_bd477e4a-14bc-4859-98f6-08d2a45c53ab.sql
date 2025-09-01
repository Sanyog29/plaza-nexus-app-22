-- Update maintenance_requests table to support new category-to-issue-type structure
-- Add issue_type column to store the mapped issue types
ALTER TABLE public.maintenance_requests 
ADD COLUMN issue_type TEXT,
ADD COLUMN category_id UUID REFERENCES public.main_categories(id);

-- Update existing records to use main category instead of sub-category
UPDATE public.maintenance_requests 
SET category_id = sc.main_category_id
FROM public.sub_categories sc
WHERE public.maintenance_requests.sub_category_id = sc.id;

-- For existing records, set a default issue type
UPDATE public.maintenance_requests 
SET issue_type = 'Legacy issue'
WHERE issue_type IS NULL;

-- Create index on new columns for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_category_id ON public.maintenance_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_issue_type ON public.maintenance_requests(issue_type);