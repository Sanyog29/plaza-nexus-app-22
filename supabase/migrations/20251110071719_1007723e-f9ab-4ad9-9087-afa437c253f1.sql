-- Fix ambiguous column reference in generate_po_number_enhanced function
CREATE OR REPLACE FUNCTION public.generate_po_number_enhanced(p_property_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_code TEXT;
  year_month TEXT;
  sequence_num INTEGER;
  po_num TEXT;
BEGIN
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
  INTO property_code
  FROM public.properties
  WHERE id = p_property_id;
  
  IF property_code IS NULL OR property_code = '' THEN
    property_code := 'GEN';
  END IF;
  
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(po.po_number FROM '[0-9]+$') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.purchase_orders po
  WHERE po.po_number LIKE 'PO-' || property_code || '-' || year_month || '-%';
  
  po_num := 'PO-' || property_code || '-' || year_month || '-' || LPAD(sequence_num::TEXT, 5, '0');
  
  RETURN po_num;
END;
$$;