-- Continue fixing Function Search Path Mutable - Part 3
-- Add SET search_path = public to more remaining functions

CREATE OR REPLACE FUNCTION public.encrypt_sensitive_field(plaintext text, field_name text)
 RETURNS bytea
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF plaintext IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_encrypt(
    plaintext,
    current_setting('app.settings.encryption_key', true)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_amc_alerts()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  asset_record RECORD;
  alert_date DATE;
BEGIN
  DELETE FROM public.amc_alerts WHERE alert_date > CURRENT_DATE AND is_sent = false;
  
  FOR asset_record IN 
    SELECT * FROM public.assets 
    WHERE status = 'operational' 
    AND next_service_due IS NOT NULL 
    AND next_service_due > CURRENT_DATE
  LOOP
    alert_date := asset_record.next_service_due - INTERVAL '7 days';
    IF alert_date >= CURRENT_DATE THEN
      INSERT INTO public.amc_alerts (asset_id, alert_type, alert_date, due_date)
      VALUES (asset_record.id, 'service_due', alert_date, asset_record.next_service_due);
    END IF;
  END LOOP;
  
  FOR asset_record IN 
    SELECT * FROM public.assets 
    WHERE status = 'operational' 
    AND amc_end_date IS NOT NULL 
    AND amc_end_date > CURRENT_DATE
  LOOP
    alert_date := asset_record.amc_end_date - INTERVAL '30 days';
    IF alert_date >= CURRENT_DATE THEN
      INSERT INTO public.amc_alerts (asset_id, alert_type, alert_date, due_date)
      VALUES (asset_record.id, 'amc_renewal', alert_date, asset_record.amc_end_date);
    END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_order_commission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
    vendor_commission_rate DECIMAL(5,2);
    commission_amt DECIMAL(10,2);
    payout_amt DECIMAL(10,2);
BEGIN
    SELECT commission_rate INTO vendor_commission_rate
    FROM public.vendors 
    WHERE id = NEW.vendor_id;
    
    commission_amt := (NEW.total_amount * vendor_commission_rate / 100);
    payout_amt := NEW.total_amount - commission_amt;
    
    NEW.commission_amount := commission_amt;
    NEW.vendor_payout_amount := payout_amt;
    
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO public.commission_records (
            vendor_id, order_id, order_amount, commission_rate, 
            commission_amount, vendor_payout_amount
        ) VALUES (
            NEW.vendor_id, NEW.id, NEW.total_amount, vendor_commission_rate,
            commission_amt, payout_amt
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_ratings_on_feedback()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
    UPDATE public.vendors 
    SET average_rating = (
        SELECT AVG(overall_rating) 
        FROM public.order_feedback 
        WHERE vendor_id = NEW.vendor_id
    )
    WHERE id = NEW.vendor_id;
    
    UPDATE public.vendors 
    SET total_orders = (
        SELECT COUNT(*) 
        FROM public.cafeteria_orders 
        WHERE vendor_id = NEW.vendor_id AND status = 'completed'
    )
    WHERE id = NEW.vendor_id;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_utility_consumption()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  reading_record RECORD;
  previous_reading RECORD;
  consumption_value DECIMAL(10,2);
BEGIN
  FOR reading_record IN 
    SELECT * FROM public.utility_readings 
    WHERE consumption IS NULL
    ORDER BY meter_id, reading_date
  LOOP
    SELECT * INTO previous_reading
    FROM public.utility_readings
    WHERE meter_id = reading_record.meter_id 
    AND reading_date < reading_record.reading_date
    ORDER BY reading_date DESC
    LIMIT 1;
    
    IF FOUND THEN
      consumption_value := reading_record.reading_value - previous_reading.reading_value;
      
      UPDATE public.utility_readings
      SET consumption = consumption_value,
          total_cost = CASE 
            WHEN cost_per_unit IS NOT NULL THEN consumption_value * cost_per_unit
            ELSE NULL
          END,
          updated_at = now()
      WHERE id = reading_record.id;
    ELSE
      UPDATE public.utility_readings
      SET consumption = 0,
          total_cost = 0,
          updated_at = now()
      WHERE id = reading_record.id;
    END IF;
    
    UPDATE public.utility_meters
    SET last_reading_date = reading_record.reading_date,
        last_reading_value = reading_record.reading_value,
        updated_at = now()
    WHERE id = reading_record.meter_id;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_system_setting(setting_category text, setting_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  setting_value jsonb;
BEGIN
  SELECT value INTO setting_value
  FROM system_settings
  WHERE category = setting_category AND key = setting_key;
  
  RETURN COALESCE(setting_value, 'null'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_system_setting(setting_category text, setting_key text, setting_value jsonb, setting_type text DEFAULT 'string'::text, setting_description text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only administrators can modify system settings';
  END IF;
  
  INSERT INTO system_settings (category, key, value, data_type, description)
  VALUES (setting_category, setting_key, setting_value, setting_type, setting_description)
  ON CONFLICT (category, key) DO UPDATE SET
    value = EXCLUDED.value,
    data_type = EXCLUDED.data_type,
    description = COALESCE(EXCLUDED.description, system_settings.description),
    updated_at = now();
    
  RETURN true;
END;
$function$;