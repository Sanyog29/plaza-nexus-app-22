-- Phase 1: Add Foreign Key Constraints for Referential Integrity
-- Add FK constraint on requisition_lists.property_id
ALTER TABLE requisition_lists
ADD CONSTRAINT fk_requisition_lists_property
FOREIGN KEY (property_id) 
REFERENCES properties(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Phase 2: Add FK constraint on requisition_list_items.requisition_list_id
ALTER TABLE requisition_list_items
ADD CONSTRAINT fk_requisition_list_items_requisition
FOREIGN KEY (requisition_list_id) 
REFERENCES requisition_lists(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Phase 3: Create Audit Trigger for Property Changes
CREATE OR REPLACE FUNCTION audit_requisition_property_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.property_id IS DISTINCT FROM NEW.property_id THEN
    INSERT INTO audit_logs (
      resource_type,
      resource_id,
      action,
      old_values,
      new_values,
      user_id,
      created_at
    ) VALUES (
      'requisition_lists',
      NEW.id,
      'property_change',
      jsonb_build_object('property_id', OLD.property_id),
      jsonb_build_object('property_id', NEW.property_id),
      auth.uid(),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_requisition_property_audit
BEFORE UPDATE ON requisition_lists
FOR EACH ROW
EXECUTE FUNCTION audit_requisition_property_change();

-- Phase 4: Add Check Constraint for Property Immutability
CREATE OR REPLACE FUNCTION check_property_immutability()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow property change only in draft status
  IF OLD.status != 'draft' AND OLD.property_id IS DISTINCT FROM NEW.property_id THEN
    RAISE EXCEPTION 'Cannot change property after requisition is submitted';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_check_property_immutability
BEFORE UPDATE ON requisition_lists
FOR EACH ROW
EXECUTE FUNCTION check_property_immutability();

-- Phase 5: Create Transactional Utility Function
CREATE OR REPLACE FUNCTION assign_requisitions_to_property(
  p_requisition_ids UUID[],
  p_property_id UUID,
  p_force_update BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
  requisition_id UUID,
  order_number TEXT,
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_req RECORD;
  v_property_exists BOOLEAN;
BEGIN
  -- Check if property exists
  SELECT EXISTS(SELECT 1 FROM properties WHERE id = p_property_id) INTO v_property_exists;
  
  IF NOT v_property_exists THEN
    RAISE EXCEPTION 'Property % does not exist', p_property_id;
  END IF;
  
  -- Process each requisition
  FOR v_req IN 
    SELECT id, order_number, status, property_id 
    FROM requisition_lists 
    WHERE id = ANY(p_requisition_ids)
  LOOP
    BEGIN
      -- Check if can be updated
      IF v_req.status != 'draft' AND NOT p_force_update THEN
        requisition_id := v_req.id;
        order_number := v_req.order_number;
        success := FALSE;
        message := 'Cannot change property - status is ' || v_req.status;
        RETURN NEXT;
        CONTINUE;
      END IF;
      
      -- Update the requisition
      UPDATE requisition_lists 
      SET property_id = p_property_id, updated_at = NOW()
      WHERE id = v_req.id;
      
      requisition_id := v_req.id;
      order_number := v_req.order_number;
      success := TRUE;
      message := 'Successfully assigned to property';
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      requisition_id := v_req.id;
      order_number := v_req.order_number;
      success := FALSE;
      message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;