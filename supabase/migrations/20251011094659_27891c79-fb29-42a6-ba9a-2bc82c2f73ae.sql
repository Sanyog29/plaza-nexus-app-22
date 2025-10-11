-- Create bulk upload tracking table
CREATE TABLE IF NOT EXISTS public.maintenance_request_bulk_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  upload_status TEXT NOT NULL DEFAULT 'processing',
  total_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_summary JSONB DEFAULT '[]'::jsonb,
  success_summary JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.maintenance_request_bulk_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all bulk uploads"
ON public.maintenance_request_bulk_uploads
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view their own uploads"
ON public.maintenance_request_bulk_uploads
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()) AND uploaded_by = auth.uid());

-- Create bulk import processing function
CREATE OR REPLACE FUNCTION public.admin_bulk_create_maintenance_requests(
  requests_data JSONB,
  upload_id UUID
)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  request_item JSONB;
  created_count INTEGER := 0;
  error_count INTEGER := 0;
  success_results JSONB := '[]'::jsonb;
  error_results JSONB := '[]'::jsonb;
  new_request_id UUID;
BEGIN
  -- Check if user is staff or admin
  IF NOT (is_staff(auth.uid()) OR is_admin(auth.uid())) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only staff and admins can bulk import requests'
    );
  END IF;

  -- Process each request
  FOR request_item IN SELECT * FROM jsonb_array_elements(requests_data)
  LOOP
    BEGIN
      -- Insert the maintenance request
      INSERT INTO public.maintenance_requests (
        title,
        description,
        location,
        priority,
        status,
        reported_by,
        building_floor_id,
        building_area_id,
        process_id,
        category_id,
        created_at
      ) VALUES (
        request_item->>'title',
        request_item->>'description',
        request_item->>'location',
        (request_item->>'priority')::maintenance_priority,
        'pending'::maintenance_status,
        auth.uid(),
        (request_item->>'building_floor_id')::uuid,
        (request_item->>'building_area_id')::uuid,
        NULLIF(request_item->>'process_id', '')::uuid,
        NULLIF(request_item->>'category_id', '')::uuid,
        COALESCE((request_item->>'created_at')::timestamptz, now())
      )
      RETURNING id INTO new_request_id;

      created_count := created_count + 1;
      success_results := success_results || jsonb_build_object(
        'row_number', request_item->>'row_number',
        'request_id', new_request_id,
        'title', request_item->>'title'
      );

    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      error_results := error_results || jsonb_build_object(
        'row_number', request_item->>'row_number',
        'error', SQLERRM,
        'title', request_item->>'title'
      );
    END;
  END LOOP;

  -- Update bulk upload record
  UPDATE public.maintenance_request_bulk_uploads
  SET 
    upload_status = 'completed',
    successful_records = created_count,
    failed_records = error_count,
    success_summary = success_results,
    error_summary = error_results,
    completed_at = now()
  WHERE id = upload_id;

  RETURN jsonb_build_object(
    'success', true,
    'success_count', created_count,
    'error_count', error_count,
    'success_results', success_results,
    'error_results', error_results
  );
END;
$$;