-- Remove old overloaded versions to avoid ambiguity
DROP FUNCTION IF EXISTS public.admin_bulk_create_maintenance_requests(jsonb, uuid);
DROP FUNCTION IF EXISTS public.admin_bulk_create_maintenance_requests(jsonb[], uuid);

-- Recreate a single, unambiguous function that accepts a JSON array (jsonb)
CREATE OR REPLACE FUNCTION public.admin_bulk_create_maintenance_requests(
  requests_data jsonb,
  upload_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_item jsonb;
  inserted_count integer := 0;
  failed_count integer := 0;
  error_details jsonb := '[]'::jsonb;
  new_request_id uuid;
BEGIN
  -- Ensure caller has sufficient privileges
  IF NOT (is_admin(auth.uid()) OR is_staff(auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins and staff can bulk create requests';
  END IF;

  -- Iterate each item in the provided JSON array
  FOR request_item IN SELECT * FROM jsonb_array_elements(requests_data)
  LOOP
    BEGIN
      INSERT INTO public.maintenance_requests (
        title,
        description,
        location,
        category_id,
        main_category_id,
        sub_category_id,
        building_floor_id,
        building_area_id,
        reported_by,
        priority,
        status,
        created_at
      ) VALUES (
        request_item->>'title',
        request_item->>'description',
        request_item->>'location',
        (request_item->>'category_id')::uuid,
        (request_item->>'main_category_id')::uuid,
        (request_item->>'sub_category_id')::uuid,
        (request_item->>'building_floor_id')::uuid,
        (request_item->>'building_area_id')::uuid,
        COALESCE((request_item->>'reported_by')::uuid, auth.uid()),
        (request_item->>'priority')::request_priority,
        COALESCE((request_item->>'status')::request_status, 'pending'::request_status),
        COALESCE((request_item->>'created_at')::timestamptz, now())
      ) RETURNING id INTO new_request_id;

      inserted_count := inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      error_details := error_details || jsonb_build_object(
        'row', request_item,
        'error', SQLERRM
      );
    END;
  END LOOP;

  -- Update the correct bulk upload tracking table
  UPDATE public.maintenance_request_bulk_uploads
  SET 
    upload_status = CASE 
      WHEN failed_count = 0 THEN 'completed'
      WHEN inserted_count = 0 THEN 'failed'
      ELSE 'completed_with_errors'
    END,
    successful_records = inserted_count,
    failed_records = failed_count,
    error_summary = error_details,
    completed_at = now()
  WHERE id = upload_id;

  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', inserted_count,
    'failed_count', failed_count,
    'error_details', error_details
  );
END;
$$;