-- Phase 1: Backfill main_category_id for existing requests
-- Create a function to infer category from title and description
CREATE OR REPLACE FUNCTION infer_main_category_id(title_text TEXT, desc_text TEXT)
RETURNS UUID AS $$
DECLARE
  category_id UUID;
  combined_text TEXT;
BEGIN
  combined_text := LOWER(COALESCE(title_text, '') || ' ' || COALESCE(desc_text, ''));
  
  -- Electrical & Lighting
  IF combined_text ~* '(electric|light|power|wiring|socket|switch|lamp|bulb|voltage|circuit)' THEN
    SELECT id INTO category_id FROM main_categories WHERE name = 'Electrical & Lighting' LIMIT 1;
    IF category_id IS NOT NULL THEN RETURN category_id; END IF;
  END IF;
  
  -- HVAC & Air Quality
  IF combined_text ~* '(hvac|temperature|cooling|heating|air|ac|ventilation|thermostat|climate)' THEN
    SELECT id INTO category_id FROM main_categories WHERE name = 'HVAC & Air Quality' LIMIT 1;
    IF category_id IS NOT NULL THEN RETURN category_id; END IF;
  END IF;
  
  -- Plumbing & Washrooms
  IF combined_text ~* '(plumb|water|leak|drain|pipe|toilet|washroom|restroom|tap|faucet|sink)' THEN
    SELECT id INTO category_id FROM main_categories WHERE name = 'Plumbing & Washrooms' LIMIT 1;
    IF category_id IS NOT NULL THEN RETURN category_id; END IF;
  END IF;
  
  -- IT & Communications
  IF combined_text ~* '(network|internet|wifi|cable|phone|computer|printer|it\s|tech|connectivity)' THEN
    SELECT id INTO category_id FROM main_categories WHERE name = 'IT & Communications' LIMIT 1;
    IF category_id IS NOT NULL THEN RETURN category_id; END IF;
  END IF;
  
  -- Housekeeping & Cleaning
  IF combined_text ~* '(clean|housekeep|dust|sweep|mop|sanitiz|garbage|trash|waste)' THEN
    SELECT id INTO category_id FROM main_categories WHERE name = 'Housekeeping & Cleaning' LIMIT 1;
    IF category_id IS NOT NULL THEN RETURN category_id; END IF;
  END IF;
  
  -- Furniture & Fixtures
  IF combined_text ~* '(furniture|chair|desk|table|cabinet|shelf|fixture|door|window)' THEN
    SELECT id INTO category_id FROM main_categories WHERE name = 'Furniture & Fixtures' LIMIT 1;
    IF category_id IS NOT NULL THEN RETURN category_id; END IF;
  END IF;
  
  -- Security & Access Control
  IF combined_text ~* '(security|access|lock|key|card|badge|alarm|cctv|camera)' THEN
    SELECT id INTO category_id FROM main_categories WHERE name = 'Security & Access Control' LIMIT 1;
    IF category_id IS NOT NULL THEN RETURN category_id; END IF;
  END IF;
  
  -- Health & Safety
  IF combined_text ~* '(safety|fire|emergency|hazard|injury|accident|first aid)' THEN
    SELECT id INTO category_id FROM main_categories WHERE name = 'Health & Safety' LIMIT 1;
    IF category_id IS NOT NULL THEN RETURN category_id; END IF;
  END IF;
  
  -- Default to Other / General
  SELECT id INTO category_id FROM main_categories WHERE name = 'Other / General' LIMIT 1;
  RETURN category_id;
END;
$$ LANGUAGE plpgsql;

-- Backfill main_category_id for existing requests
UPDATE maintenance_requests
SET main_category_id = infer_main_category_id(title, description)
WHERE main_category_id IS NULL;

-- Sanitize location strings (remove "undefined" and clean up)
UPDATE maintenance_requests
SET location = CASE
  WHEN location IS NULL OR location = '' THEN 'Not Specified'
  WHEN location LIKE '%undefined%' THEN 
    TRIM(REPLACE(REPLACE(REPLACE(location, ' - undefined', ''), 'undefined - ', ''), 'undefined', ''))
  ELSE location
END
WHERE location IS NULL 
   OR location = '' 
   OR location LIKE '%undefined%';

-- Phase 2: Update bulk import function to handle defaults
CREATE OR REPLACE FUNCTION admin_bulk_create_maintenance_requests(requests JSONB)
RETURNS JSONB AS $$
DECLARE
  request JSONB;
  inserted_count INTEGER := 0;
  failed_count INTEGER := 0;
  error_details JSONB := '[]'::JSONB;
  default_category_id UUID;
BEGIN
  -- Get default category ID for fallback
  SELECT id INTO default_category_id 
  FROM main_categories 
  WHERE name = 'Other / General' 
  LIMIT 1;

  FOR request IN SELECT * FROM jsonb_array_elements(requests)
  LOOP
    BEGIN
      -- Validate and set default main_category_id if missing or invalid
      IF request->>'main_category_id' IS NULL OR 
         NOT EXISTS (SELECT 1 FROM main_categories WHERE id = (request->>'main_category_id')::UUID) THEN
        request := jsonb_set(request, '{main_category_id}', to_jsonb(default_category_id::TEXT));
      END IF;
      
      -- Sanitize location - set to 'Not Specified' if NULL or contains 'undefined'
      IF request->>'location' IS NULL OR 
         request->>'location' = '' OR 
         request->>'location' LIKE '%undefined%' THEN
        request := jsonb_set(request, '{location}', '"Not Specified"');
      END IF;

      -- Insert the request
      INSERT INTO maintenance_requests (
        title, description, priority, status, reported_by,
        main_category_id, sub_category_id, 
        building_area_id, building_floor_id, location,
        created_at, updated_at
      ) VALUES (
        request->>'title',
        request->>'description',
        COALESCE((request->>'priority')::maintenance_priority, 'medium'),
        COALESCE((request->>'status')::maintenance_status, 'pending'),
        COALESCE((request->>'reported_by')::UUID, auth.uid()),
        (request->>'main_category_id')::UUID,
        (request->>'sub_category_id')::UUID,
        (request->>'building_area_id')::UUID,
        (request->>'building_floor_id')::UUID,
        COALESCE(request->>'location', 'Not Specified'),
        COALESCE((request->>'created_at')::TIMESTAMPTZ, NOW()),
        NOW()
      );
      
      inserted_count := inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      error_details := error_details || jsonb_build_object(
        'title', request->>'title',
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted_count', inserted_count,
    'failed_count', failed_count,
    'error_details', error_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;