-- Fix bulk import function with correct signature and table references
DROP FUNCTION IF EXISTS admin_bulk_create_maintenance_requests(jsonb);
DROP FUNCTION IF EXISTS admin_bulk_create_maintenance_requests(jsonb, uuid);

CREATE OR REPLACE FUNCTION admin_bulk_create_maintenance_requests(
  requests_data jsonb,
  upload_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request jsonb;
  inserted_count integer := 0;
  failed_count integer := 0;
  error_details jsonb := '[]'::jsonb;
  request_id uuid;
  default_category_id uuid;
  row_num integer := 0;
BEGIN
  -- Check if user is admin or staff
  IF NOT (is_admin(auth.uid()) OR is_staff(auth.uid())) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins and staff can bulk create maintenance requests'
    );
  END IF;

  -- Get the "Other / General" category ID as fallback from main_categories
  SELECT id INTO default_category_id
  FROM main_categories
  WHERE name = 'Other / General'
  LIMIT 1;

  -- Process each request
  FOR request IN SELECT * FROM jsonb_array_elements(requests_data)
  LOOP
    row_num := row_num + 1;
    BEGIN
      -- Sanitize location field
      IF request->>'location' IS NULL 
         OR trim(request->>'location') = '' 
         OR lower(request->>'location') = 'undefined'
         OR request->>'location' ~ 'undefined' THEN
        request := jsonb_set(request, '{location}', '"Not Specified"'::jsonb);
      ELSE
        -- Clean up any 'undefined' in the location string
        request := jsonb_set(
          request, 
          '{location}', 
          to_jsonb(regexp_replace(request->>'location', 'undefined', '', 'gi'))
        );
      END IF;

      -- Set default main_category_id if NULL or invalid
      IF request->>'main_category_id' IS NULL THEN
        request := jsonb_set(request, '{main_category_id}', to_jsonb(default_category_id::text));
      ELSIF NOT EXISTS (
        SELECT 1 FROM main_categories WHERE id = (request->>'main_category_id')::uuid
      ) THEN
        request := jsonb_set(request, '{main_category_id}', to_jsonb(default_category_id::text));
      END IF;

      INSERT INTO maintenance_requests (
        title, description, priority, status, reported_by,
        main_category_id, sub_category_id, 
        building_area_id, building_floor_id, process_id, location,
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
        (request->>'process_id')::UUID,
        COALESCE(request->>'location', 'Not Specified'),
        COALESCE((request->>'created_at')::TIMESTAMPTZ, NOW()),
        NOW()
      )
      RETURNING id INTO request_id;

      inserted_count := inserted_count + 1;

    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      error_details := error_details || jsonb_build_object(
        'row_number', row_num,
        'request', request,
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', inserted_count,
    'failed_count', failed_count,
    'error_details', error_details
  );
END;
$$;