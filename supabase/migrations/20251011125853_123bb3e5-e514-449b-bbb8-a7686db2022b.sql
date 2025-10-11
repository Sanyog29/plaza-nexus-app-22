-- Add process_id to bulk import function
DROP FUNCTION IF EXISTS admin_bulk_create_maintenance_requests(jsonb);

CREATE OR REPLACE FUNCTION admin_bulk_create_maintenance_requests(requests jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request jsonb;
  success_count integer := 0;
  error_count integer := 0;
  errors jsonb := '[]'::jsonb;
  request_id uuid;
  default_category_id uuid;
BEGIN
  -- Check if user is admin or staff
  IF NOT (is_admin(auth.uid()) OR is_staff(auth.uid())) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins and staff can bulk create maintenance requests'
    );
  END IF;

  -- Get the "Other / General" category ID as fallback
  SELECT id INTO default_category_id
  FROM maintenance_categories
  WHERE name = 'Other / General'
  LIMIT 1;

  -- Process each request
  FOR request IN SELECT * FROM jsonb_array_elements(requests)
  LOOP
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
        SELECT 1 FROM maintenance_categories WHERE id = (request->>'main_category_id')::uuid
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

      success_count := success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      errors := errors || jsonb_build_object(
        'request', request,
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'success_count', success_count,
    'error_count', error_count,
    'errors', errors
  );
END;
$$;