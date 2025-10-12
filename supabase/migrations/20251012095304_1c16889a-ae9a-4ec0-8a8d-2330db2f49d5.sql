-- Fix admin_bulk_create_maintenance_requests to prevent silent failures
CREATE OR REPLACE FUNCTION public.admin_bulk_create_maintenance_requests(requests_data jsonb, upload_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  request jsonb;
  inserted_count integer := 0;
  failed_count integer := 0;
  error_details jsonb := '[]'::jsonb;
  request_id uuid;
  default_category_id uuid;
  row_num integer := 0;
  first_error text := NULL;
BEGIN
  -- Permission check
  IF NOT (is_admin(auth.uid()) OR is_staff(auth.uid())) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins and staff can bulk create maintenance requests');
  END IF;

  -- Fallback category = "Other / General"
  SELECT id INTO default_category_id
  FROM main_categories
  WHERE name = 'Other / General'
  LIMIT 1;

  -- Process each request
  FOR request IN SELECT * FROM jsonb_array_elements(requests_data)
  LOOP
    row_num := row_num + 1;
    BEGIN
      -- Sanitize location
      IF request->>'location' IS NULL 
         OR trim(request->>'location') = '' 
         OR lower(request->>'location') = 'undefined'
         OR request->>'location' ~ 'undefined' THEN
        request := jsonb_set(request, '{location}', '"Not Specified"'::jsonb);
      ELSE
        request := jsonb_set(
          request, 
          '{location}', 
          to_jsonb(regexp_replace(request->>'location', 'undefined', '', 'gi'))
        );
      END IF;

      -- Ensure main_category_id exists; fallback if invalid/missing
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
        -- Safe priority mapping using correct enum type
        CASE lower(coalesce(request->>'priority',''))
          WHEN 'urgent' THEN 'urgent'::public.request_priority
          WHEN 'high'   THEN 'high'::public.request_priority
          WHEN 'medium' THEN 'medium'::public.request_priority
          WHEN 'low'    THEN 'low'::public.request_priority
          ELSE 'medium'::public.request_priority
        END,
        -- Safe status mapping using correct enum type
        CASE lower(coalesce(request->>'status',''))
          WHEN 'pending'     THEN 'pending'::public.request_status
          WHEN 'in_progress' THEN 'in_progress'::public.request_status
          WHEN 'completed'   THEN 'completed'::public.request_status
          WHEN 'cancelled'   THEN 'cancelled'::public.request_status
          WHEN 'assigned'    THEN 'assigned'::public.request_status
          WHEN 'en_route'    THEN 'en_route'::public.request_status
          ELSE 'pending'::public.request_status
        END,
        COALESCE((request->>'reported_by')::uuid, auth.uid()),
        (request->>'main_category_id')::uuid,
        (request->>'sub_category_id')::uuid,
        (request->>'building_area_id')::uuid,
        (request->>'building_floor_id')::uuid,
        (request->>'process_id')::uuid,
        COALESCE(request->>'location', 'Not Specified'),
        COALESCE((request->>'created_at')::timestamptz, now()),
        now()
      )
      RETURNING id INTO request_id;

      inserted_count := inserted_count + 1;

    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      
      -- Capture first error for logging
      IF first_error IS NULL THEN
        first_error := SQLERRM;
      END IF;
      
      error_details := error_details || jsonb_build_object(
        'row_number', row_num,
        'title', request->>'title',
        'location', request->>'location',
        'error', SQLERRM,
        'error_detail', SQLSTATE
      );
    END;
  END LOOP;

  -- Update the bulk upload record with results
  UPDATE maintenance_request_bulk_uploads
  SET 
    successful_records = inserted_count,
    failed_records = failed_count,
    upload_status = 'completed',
    error_summary = CASE 
      WHEN failed_count > 0 THEN error_details 
      ELSE '[]'::jsonb 
    END
  WHERE id = upload_id;

  -- Return success=false if nothing was inserted
  IF inserted_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', COALESCE(first_error, 'All requests failed to insert'),
      'inserted_count', 0,
      'failed_count', failed_count,
      'error_details', error_details
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', inserted_count,
    'failed_count', failed_count,
    'error_details', error_details
  );
END;
$function$;