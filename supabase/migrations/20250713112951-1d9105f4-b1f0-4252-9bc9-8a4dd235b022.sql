-- Insert sample maintenance requests with valid statuses
DO $$
DECLARE
    category_hvac_id UUID;
    category_electrical_id UUID;
    category_plumbing_id UUID;
    category_general_id UUID;
    tenant_user_id UUID;
    staff_user_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO category_hvac_id FROM maintenance_categories WHERE name = 'HVAC' LIMIT 1;
    SELECT id INTO category_electrical_id FROM maintenance_categories WHERE name = 'Electrical' LIMIT 1;
    SELECT id INTO category_plumbing_id FROM maintenance_categories WHERE name = 'Plumbing' LIMIT 1;
    SELECT id INTO category_general_id FROM maintenance_categories WHERE name = 'General' LIMIT 1;
    
    -- Get user IDs or create sample ones
    SELECT id INTO tenant_user_id FROM profiles WHERE role = 'tenant_manager' LIMIT 1;
    SELECT id INTO staff_user_id FROM profiles WHERE role = 'field_staff' LIMIT 1;
    
    -- If no users exist, create sample ones
    IF tenant_user_id IS NULL THEN
        INSERT INTO profiles (id, first_name, last_name, role, approval_status) 
        VALUES (gen_random_uuid(), 'Demo', 'Tenant', 'tenant_manager', 'approved')
        RETURNING id INTO tenant_user_id;
    END IF;
    
    IF staff_user_id IS NULL THEN
        INSERT INTO profiles (id, first_name, last_name, role, approval_status) 
        VALUES (gen_random_uuid(), 'Demo', 'Staff', 'field_staff', 'approved')
        RETURNING id INTO staff_user_id;
    END IF;

    -- Insert sample maintenance requests with valid enum values
    INSERT INTO maintenance_requests (
        title, description, priority, status, location, category_id, reported_by, 
        assigned_to, estimated_completion, created_at, updated_at, sla_breach_at
    ) VALUES
    ('HVAC Unit Making Noise', 'The main HVAC unit in Building A is making unusual grinding noises', 'high', 'in_progress', 'Building A - Basement', category_hvac_id, tenant_user_id, staff_user_id, NOW() + INTERVAL '2 hours', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '4 hours'),
    ('Fluorescent Light Flickering', 'Multiple fluorescent lights in the 3rd floor corridor are flickering', 'medium', 'pending', 'Building B - 3rd Floor Corridor', category_electrical_id, tenant_user_id, NULL, NOW() + INTERVAL '4 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '6 hours'),
    ('Water Leak in Restroom', 'Small water leak detected under sink in mens restroom', 'urgent', 'in_progress', 'Building A - 2nd Floor Mens Restroom', category_plumbing_id, tenant_user_id, staff_user_id, NOW() + INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '15 minutes', NOW() + INTERVAL '2 hours'),
    ('Door Lock Malfunction', 'Electronic door lock on main entrance is not responding', 'high', 'completed', 'Building A - Main Entrance', category_general_id, tenant_user_id, staff_user_id, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '2 hours'),
    ('Air Conditioning Not Working', 'Conference room AC unit stopped working', 'medium', 'pending', 'Building B - Conference Room 201', category_hvac_id, tenant_user_id, NULL, NOW() + INTERVAL '6 hours', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '8 hours'),
    ('Elevator Noise', 'Elevator making strange sounds between 2nd and 3rd floor', 'low', 'in_progress', 'Building A - Elevator', category_general_id, tenant_user_id, staff_user_id, NOW() + INTERVAL '12 hours', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '16 hours'),
    ('Broken Window Latch', 'Window latch broken in office 305', 'low', 'completed', 'Building A - Office 305', category_general_id, tenant_user_id, staff_user_id, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '8 hours'),
    ('Parking Lot Light Out', 'Street light in parking lot section C is not working', 'medium', 'in_progress', 'Parking Lot - Section C', category_electrical_id, tenant_user_id, staff_user_id, NOW() + INTERVAL '3 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '5 hours')
    ON CONFLICT DO NOTHING;
    
    -- Update completed requests with completion timestamps
    UPDATE maintenance_requests 
    SET completed_at = created_at + INTERVAL '3 hours' 
    WHERE status = 'completed' AND completed_at IS NULL;
END $$;