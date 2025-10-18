-- Fix Critical Security Issues (Corrected)

-- 1. Remove password_hash column from profiles table (CRITICAL)
-- This column exposes password hashes through RLS policies
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- 2. Recreate profiles_with_decrypted_data view with built-in security
-- Add explicit filtering to only allow users to see their own decrypted data or admins
DROP VIEW IF EXISTS public.profiles_with_decrypted_data;
CREATE OR REPLACE VIEW public.profiles_with_decrypted_data
WITH (security_invoker = true)
AS
SELECT 
  id,
  first_name,
  last_name,
  email,
  CASE 
    WHEN auth.uid() = id OR is_admin(auth.uid()) THEN
      pgp_sym_decrypt(phone_number_encrypted::bytea, current_setting('app.settings.encryption_key', true))
    ELSE NULL
  END AS phone_number,
  CASE 
    WHEN auth.uid() = id OR is_admin(auth.uid()) THEN
      pgp_sym_decrypt(mobile_number_encrypted::bytea, current_setting('app.settings.encryption_key', true))
    ELSE NULL
  END AS mobile_number,
  CASE 
    WHEN auth.uid() = id OR is_admin(auth.uid()) THEN
      pgp_sym_decrypt(government_id_encrypted::bytea, current_setting('app.settings.encryption_key', true))
    ELSE NULL
  END AS government_id,
  CASE 
    WHEN auth.uid() = id OR is_admin(auth.uid()) THEN
      pgp_sym_decrypt(employee_id_encrypted::bytea, current_setting('app.settings.encryption_key', true))
    ELSE NULL
  END AS employee_id,
  department,
  role,
  approval_status
FROM public.profiles
WHERE auth.uid() = id OR is_admin(auth.uid());

-- 3. Create server-side stock validation function
CREATE OR REPLACE FUNCTION public.validate_and_create_cafeteria_order(
  p_vendor_id uuid,
  p_order_items jsonb,
  p_total_amount numeric,
  p_pickup_time timestamp with time zone,
  p_customer_instructions text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_item jsonb;
  v_current_stock integer;
  v_item_id uuid;
  v_quantity integer;
  v_item_name text;
BEGIN
  -- Validate user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;

  -- Validate stock for each item atomically
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    v_item_id := (v_item->>'id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    
    -- Lock row and get current stock
    SELECT stock_quantity, name INTO v_current_stock, v_item_name
    FROM cafeteria_menu_items
    WHERE id = v_item_id
    FOR UPDATE;
    
    -- Check if item exists
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Item not found'
      );
    END IF;
    
    -- Validate stock availability
    IF v_current_stock < v_quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Insufficient stock for %s. Available: %s', v_item_name, v_current_stock)
      );
    END IF;
    
    -- Decrement stock atomically
    UPDATE cafeteria_menu_items
    SET stock_quantity = stock_quantity - v_quantity,
        updated_at = now()
    WHERE id = v_item_id;
  END LOOP;
  
  -- Create the order
  INSERT INTO cafeteria_orders (
    user_id,
    vendor_id,
    total_amount,
    pickup_time,
    customer_instructions,
    status,
    payment_status
  ) VALUES (
    auth.uid(),
    p_vendor_id,
    p_total_amount,
    p_pickup_time,
    p_customer_instructions,
    'pending',
    'pending'
  )
  RETURNING id INTO v_order_id;
  
  -- Insert order items
  INSERT INTO order_items (
    order_id,
    menu_item_id,
    quantity,
    unit_price,
    subtotal
  )
  SELECT 
    v_order_id,
    (item->>'id')::uuid,
    (item->>'quantity')::integer,
    (item->>'price')::numeric,
    (item->>'quantity')::integer * (item->>'price')::numeric
  FROM jsonb_array_elements(p_order_items) AS item;
  
  -- Log successful order creation
  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    new_values
  ) VALUES (
    auth.uid(),
    'create_cafeteria_order',
    'cafeteria_order',
    v_order_id,
    jsonb_build_object(
      'vendor_id', p_vendor_id,
      'total_amount', p_total_amount,
      'items_count', jsonb_array_length(p_order_items)
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'message', 'Order created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Rollback happens automatically
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Order creation failed: ' || SQLERRM
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_and_create_cafeteria_order TO authenticated;

COMMENT ON FUNCTION public.validate_and_create_cafeteria_order IS 'Server-side order validation with atomic stock checks. Prevents client-side bypass of inventory limits.';