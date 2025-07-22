-- Phase 2: Database Cleanup & Enhancement for Maintenance Categories

-- First, let's clean up duplicate categories by keeping the oldest entry for each category name
-- and updating any existing maintenance_requests to use the consolidated categories

-- Update requests that reference duplicate Cleaning categories to use the first one
UPDATE maintenance_requests 
SET category_id = '637ec8a6-5998-4577-9823-bf0ab54af806'
WHERE category_id IN ('70c85259-a3c4-4e5c-b8aa-d21a4e0a78ea', '6f766120-7367-45d2-932a-2b42298db708');

-- Update requests that reference duplicate Electrical categories to use the first one  
UPDATE maintenance_requests 
SET category_id = 'fda4e4ad-6083-482c-98b8-d6cb6b824da0'
WHERE category_id IN ('090e8d87-79df-49c0-834b-2f805ea0c3b0', '1e6144fb-79e7-4559-8538-faf48704d1ae');

-- Update requests that reference duplicate General Maintenance categories to use the first one
UPDATE maintenance_requests 
SET category_id = 'cdd83d03-3df4-405a-b664-9aadfd7c53a2'
WHERE category_id IN ('6a2c83b5-35ef-4df5-a0bd-8b98f4f0d630', 'da41e45b-de74-44d9-9f29-8151f75271a3');

-- Update requests that reference duplicate HVAC categories to use the first one
UPDATE maintenance_requests 
SET category_id = '0464f161-ebec-41b2-97ac-048cac3491ba'
WHERE category_id IN ('5db99419-6e43-48cc-8978-ee826d7cd19c', 'e570e8e1-15d5-4526-a497-7074ac0d492a');

-- Update requests that reference duplicate Plumbing categories to use the first one
UPDATE maintenance_requests 
SET category_id = '7ca1791c-2112-4c9e-bb65-c6c785ece04c'
WHERE category_id IN ('8fcd55fd-ef80-4e5a-ae7e-9c335504fdbf', '05f15445-e47f-44db-838e-6524f2fa2213');

-- Update requests that reference duplicate Security categories to use the first one
UPDATE maintenance_requests 
SET category_id = '383ebb0c-2ea7-4bc3-8b16-618234ace91b'
WHERE category_id IN ('6ca719b0-c05e-4cd7-8551-4c379574357a');

-- Now delete the duplicate categories
DELETE FROM maintenance_categories 
WHERE id IN (
  '70c85259-a3c4-4e5c-b8aa-d21a4e0a78ea', -- Cleaning duplicate 1
  '6f766120-7367-45d2-932a-2b42298db708', -- Cleaning duplicate 2
  '090e8d87-79df-49c0-834b-2f805ea0c3b0', -- Electrical duplicate 1
  '1e6144fb-79e7-4559-8538-faf48704d1ae', -- Electrical duplicate 2
  '6a2c83b5-35ef-4df5-a0bd-8b98f4f0d630', -- General Maintenance duplicate 1
  'da41e45b-de74-44d9-9f29-8151f75271a3', -- General duplicate
  '5db99419-6e43-48cc-8978-ee826d7cd19c', -- HVAC duplicate 1
  'e570e8e1-15d5-4526-a497-7074ac0d492a', -- HVAC duplicate 2
  '8fcd55fd-ef80-4e5a-ae7e-9c335504fdbf', -- Plumbing duplicate 1
  '05f15445-e47f-44db-838e-6524f2fa2213', -- Plumbing duplicate 2
  '6ca719b0-c05e-4cd7-8551-4c379574357a'  -- Security duplicate
);

-- Add new columns to enhance the category system
ALTER TABLE maintenance_categories 
ADD COLUMN IF NOT EXISTS category_group TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_resolution_minutes INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing categories with enhanced information
UPDATE maintenance_categories SET 
  category_group = 'Infrastructure',
  sort_order = 1,
  estimated_resolution_minutes = 240,
  description = 'Housekeeping, sanitation, waste management'
WHERE name = 'Cleaning';

UPDATE maintenance_categories SET 
  category_group = 'Infrastructure', 
  sort_order = 2,
  estimated_resolution_minutes = 120,
  description = 'Electrical issues, power outages, lighting problems'
WHERE name = 'Electrical';

UPDATE maintenance_categories SET 
  category_group = 'Infrastructure',
  sort_order = 3, 
  estimated_resolution_minutes = 180,
  description = 'Other maintenance and repair issues'
WHERE name = 'General Maintenance';

UPDATE maintenance_categories SET 
  category_group = 'Infrastructure',
  sort_order = 4,
  estimated_resolution_minutes = 150,
  description = 'Heating, ventilation, air conditioning issues'
WHERE name = 'HVAC';

UPDATE maintenance_categories SET 
  category_group = 'Technology',
  sort_order = 5,
  estimated_resolution_minutes = 90,
  description = 'Computer, network, printer issues'
WHERE name = 'IT Support';

UPDATE maintenance_categories SET 
  category_group = 'Infrastructure',
  sort_order = 6,
  estimated_resolution_minutes = 120,
  description = 'Water leaks, drain issues, toilet problems'
WHERE name = 'Plumbing';

UPDATE maintenance_categories SET 
  category_group = 'Safety & Security',
  sort_order = 7,
  estimated_resolution_minutes = 60,
  description = 'Safety hazards, emergency repairs'
WHERE name = 'Safety';

UPDATE maintenance_categories SET 
  category_group = 'Safety & Security',
  sort_order = 8,
  estimated_resolution_minutes = 90,
  description = 'Access control, locks, safety concerns'
WHERE name = 'Security';

-- Create function to update category usage count
CREATE OR REPLACE FUNCTION public.update_category_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE maintenance_categories 
    SET usage_count = usage_count + 1
    WHERE id = NEW.category_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update usage counts
DROP TRIGGER IF EXISTS update_category_usage_trigger ON maintenance_requests;
CREATE TRIGGER update_category_usage_trigger
  AFTER INSERT ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_category_usage_count();

-- Initialize usage counts based on existing requests
UPDATE maintenance_categories 
SET usage_count = (
  SELECT COUNT(*) 
  FROM maintenance_requests 
  WHERE maintenance_requests.category_id = maintenance_categories.id
);

-- Create index for better performance on category queries
CREATE INDEX IF NOT EXISTS idx_maintenance_categories_group_order 
ON maintenance_categories(category_group, sort_order);

CREATE INDEX IF NOT EXISTS idx_maintenance_categories_usage 
ON maintenance_categories(usage_count DESC);

-- Add unique constraint to prevent future duplicates
ALTER TABLE maintenance_categories 
ADD CONSTRAINT unique_category_name_active 
UNIQUE (name) DEFERRABLE INITIALLY DEFERRED;