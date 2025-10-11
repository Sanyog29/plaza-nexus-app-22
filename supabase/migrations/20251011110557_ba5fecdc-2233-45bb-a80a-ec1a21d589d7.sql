-- Fix table name in bulk create maintenance requests function
CREATE OR REPLACE FUNCTION public.admin_bulk_create_maintenance_requests(
    request_data jsonb[],
    upload_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    inserted_count INTEGER := 0;
    failed_count INTEGER := 0;
    batch_size INTEGER := 100;
    batch_start INTEGER := 1;
    batch_end INTEGER;
    current_batch jsonb[];
    result jsonb;
BEGIN
    -- Validate user is admin or staff
    IF NOT (is_admin(auth.uid()) OR is_staff(auth.uid())) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins and staff can bulk create requests';
    END IF;

    -- Process in batches
    WHILE batch_start <= array_length(request_data, 1) LOOP
        batch_end := LEAST(batch_start + batch_size - 1, array_length(request_data, 1));
        current_batch := request_data[batch_start:batch_end];

        -- Insert batch
        BEGIN
            WITH inserted AS (
                INSERT INTO maintenance_requests (
                    title,
                    description,
                    priority,
                    status,
                    location,
                    category_id,
                    main_category_id,
                    sub_category_id,
                    building_floor_id,
                    building_area_id,
                    reported_by,
                    created_at
                )
                SELECT
                    (item->>'title')::text,
                    (item->>'description')::text,
                    (item->>'priority')::maintenance_priority,
                    COALESCE((item->>'status')::maintenance_status, 'pending'),
                    (item->>'location')::text,
                    (item->>'category_id')::uuid,
                    (item->>'main_category_id')::uuid,
                    (item->>'sub_category_id')::uuid,
                    (item->>'building_floor_id')::uuid,
                    (item->>'building_area_id')::uuid,
                    COALESCE((item->>'reported_by')::uuid, auth.uid()),
                    COALESCE((item->>'created_at')::timestamptz, now())
                FROM unnest(current_batch) AS item
                RETURNING id
            )
            SELECT COUNT(*) INTO inserted_count FROM inserted;

            failed_count := failed_count + (batch_end - batch_start + 1 - inserted_count);
        EXCEPTION WHEN OTHERS THEN
            failed_count := failed_count + (batch_end - batch_start + 1);
        END;

        batch_start := batch_end + 1;
    END LOOP;

    -- Update upload record with correct table name
    UPDATE public.maintenance_request_bulk_uploads
    SET 
        upload_status = 'completed',
        successful_records = inserted_count,
        failed_records = failed_count,
        completed_at = now()
    WHERE id = upload_id;

    result := jsonb_build_object(
        'success', true,
        'inserted_count', inserted_count,
        'failed_count', failed_count
    );

    RETURN result;
END;
$$;