-- ============================================
-- PHASE 1: PERMISSION SYSTEM DATABASE SCHEMA
-- ============================================

-- 1. Create permission_action enum with all granular permissions
CREATE TYPE permission_action AS ENUM (
  -- Maintenance & Ticketing
  'view_tickets',
  'create_ticket',
  'close_ticket',
  'assign_ticket',
  'escalate_ticket',
  'approve_ticket_closure',
  
  -- Requisitions
  'view_requisitions',
  'create_requisition',
  'approve_requisition',
  'reject_requisition',
  
  -- Procurement
  'view_procurement',
  'create_purchase_order',
  'approve_purchase',
  'manage_vendors',
  
  -- Reports (All Types)
  'view_maintenance_reports',
  'view_financial_reports',
  'view_executive_reports',
  'view_vendor_reports',
  'generate_reports',
  'schedule_reports',
  'export_reports',
  'delete_report_history',
  
  -- Analytics
  'view_basic_analytics',
  'view_advanced_analytics',
  'view_financial_analytics',
  
  -- User Management
  'view_users',
  'create_users',
  'edit_users',
  'delete_users',
  'assign_roles',
  
  -- System Configuration
  'manage_properties',
  'configure_system',
  'view_audit_logs',
  'manage_integrations'
);

-- 2. Create permission_categories table
CREATE TABLE permission_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  icon TEXT,
  description TEXT,
  parent_category_id UUID REFERENCES permission_categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create permission_definitions table
CREATE TABLE permission_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action permission_action NOT NULL UNIQUE,
  category_id UUID REFERENCES permission_categories(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  minimum_tier INTEGER NOT NULL,
  display_order INTEGER NOT NULL,
  is_dangerous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create user_permissions table
CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  permission_action permission_action NOT NULL,
  is_granted BOOLEAN DEFAULT TRUE,
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id, permission_action)
);

-- 5. Create role_permission_templates table
CREATE TABLE role_permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  tier INTEGER NOT NULL,
  permission_action permission_action NOT NULL,
  is_granted_by_default BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_action)
);

-- 6. Create property_user_roles table
CREATE TABLE property_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  assigned_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id, role)
);

-- 7. Create permission_audit_log table
CREATE TABLE permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  property_id UUID REFERENCES properties(id),
  permission_action permission_action NOT NULL,
  action_type TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POPULATE INITIAL DATA
-- ============================================

-- Insert permission categories
INSERT INTO permission_categories (name, display_order, icon, description) VALUES
('Ticketing & Maintenance', 1, 'Ticket', 'Manage maintenance tickets and service requests'),
('Requisitions', 2, 'ClipboardList', 'Create and manage requisitions'),
('Procurement', 3, 'ShoppingCart', 'Purchase orders and vendor management'),
('Reports & Analytics', 4, 'BarChart3', 'Access reports and analytics'),
('User Management', 5, 'Users', 'Manage users and permissions'),
('System Configuration', 6, 'Settings', 'System-wide configuration');

-- Insert permission definitions with explicit casts
INSERT INTO permission_definitions (action, category_id, name, description, minimum_tier, display_order, is_dangerous) VALUES
  -- Ticketing
  ('view_tickets'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Ticketing & Maintenance'), 'View Tickets', 'View maintenance tickets', 1, 1, false),
  ('create_ticket'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Ticketing & Maintenance'), 'Create Ticket', 'Create new maintenance tickets', 1, 2, false),
  ('close_ticket'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Ticketing & Maintenance'), 'Close Ticket', 'Mark tickets as resolved', 2, 3, false),
  ('assign_ticket'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Ticketing & Maintenance'), 'Assign Ticket', 'Assign tickets to staff', 2, 4, false),
  ('escalate_ticket'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Ticketing & Maintenance'), 'Escalate Ticket', 'Escalate tickets to higher levels', 2, 5, false),
  ('approve_ticket_closure'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Ticketing & Maintenance'), 'Approve Closure', 'Approve ticket closure', 3, 6, false),
  
  -- Requisitions
  ('view_requisitions'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Requisitions'), 'View Requisitions', 'View requisition lists', 1, 1, false),
  ('create_requisition'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Requisitions'), 'Create Requisition', 'Create new requisitions', 2, 2, false),
  ('approve_requisition'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Requisitions'), 'Approve Requisition', 'Approve requisition requests', 3, 3, false),
  ('reject_requisition'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Requisitions'), 'Reject Requisition', 'Reject requisition requests', 3, 4, false),
  
  -- Procurement
  ('view_procurement'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Procurement'), 'View Procurement', 'View procurement data', 1, 1, false),
  ('create_purchase_order'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Procurement'), 'Create Purchase Order', 'Create purchase orders', 2, 2, false),
  ('approve_purchase'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Procurement'), 'Approve Purchase', 'Approve purchase orders', 4, 3, false),
  ('manage_vendors'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Procurement'), 'Manage Vendors', 'Manage vendor relationships', 3, 4, false),
  
  -- Reports
  ('view_maintenance_reports'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'View Maintenance Reports', 'Access maintenance reports', 1, 1, false),
  ('view_vendor_reports'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'View Vendor Reports', 'Access vendor performance reports', 2, 2, false),
  ('view_financial_reports'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'View Financial Reports', 'Access financial reports', 4, 3, false),
  ('view_executive_reports'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'View Executive Reports', 'Access executive dashboards', 5, 4, false),
  ('generate_reports'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'Generate Reports', 'Create custom reports', 2, 5, false),
  ('schedule_reports'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'Schedule Reports', 'Schedule automated reports', 3, 6, false),
  ('export_reports'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'Export Reports', 'Export report data', 2, 7, false),
  ('delete_report_history'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'Delete Report History', 'Delete historical report data', 5, 8, true),
  
  -- Analytics
  ('view_basic_analytics'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'View Basic Analytics', 'View basic analytics', 1, 9, false),
  ('view_advanced_analytics'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'View Advanced Analytics', 'Access advanced analytics', 3, 10, false),
  ('view_financial_analytics'::permission_action, (SELECT id FROM permission_categories WHERE name = 'Reports & Analytics'), 'View Financial Analytics', 'Access financial analytics', 4, 11, false),
  
  -- User Management
  ('view_users'::permission_action, (SELECT id FROM permission_categories WHERE name = 'User Management'), 'View Users', 'View user list', 5, 1, false),
  ('create_users'::permission_action, (SELECT id FROM permission_categories WHERE name = 'User Management'), 'Create Users', 'Create new users', 6, 2, false),
  ('edit_users'::permission_action, (SELECT id FROM permission_categories WHERE name = 'User Management'), 'Edit Users', 'Modify user details', 6, 3, false),
  ('delete_users'::permission_action, (SELECT id FROM permission_categories WHERE name = 'User Management'), 'Delete Users', 'Delete user accounts', 6, 4, true),
  ('assign_roles'::permission_action, (SELECT id FROM permission_categories WHERE name = 'User Management'), 'Assign Roles', 'Assign roles to users', 6, 5, true),
  
  -- System
  ('manage_properties'::permission_action, (SELECT id FROM permission_categories WHERE name = 'System Configuration'), 'Manage Properties', 'Manage property settings', 5, 1, false),
  ('configure_system'::permission_action, (SELECT id FROM permission_categories WHERE name = 'System Configuration'), 'Configure System', 'System-wide configuration', 6, 2, true),
  ('view_audit_logs'::permission_action, (SELECT id FROM permission_categories WHERE name = 'System Configuration'), 'View Audit Logs', 'Access audit logs', 5, 3, false),
  ('manage_integrations'::permission_action, (SELECT id FROM permission_categories WHERE name = 'System Configuration'), 'Manage Integrations', 'Manage external integrations', 6, 4, false);

-- Populate role_permission_templates with default permissions
INSERT INTO role_permission_templates (role, tier, permission_action, is_granted_by_default) VALUES
  -- Tier 1: FE
  ('fe'::app_role, 1, 'view_tickets'::permission_action, true),
  ('fe'::app_role, 1, 'create_ticket'::permission_action, true),
  ('fe'::app_role, 1, 'view_requisitions'::permission_action, true),
  ('fe'::app_role, 1, 'view_procurement'::permission_action, true),
  ('fe'::app_role, 1, 'view_maintenance_reports'::permission_action, true),
  ('fe'::app_role, 1, 'view_basic_analytics'::permission_action, true),
  
  -- Tier 2: MST
  ('mst'::app_role, 2, 'view_tickets'::permission_action, true),
  ('mst'::app_role, 2, 'create_ticket'::permission_action, true),
  ('mst'::app_role, 2, 'close_ticket'::permission_action, true),
  ('mst'::app_role, 2, 'assign_ticket'::permission_action, true),
  ('mst'::app_role, 2, 'view_requisitions'::permission_action, true),
  ('mst'::app_role, 2, 'create_requisition'::permission_action, true),
  ('mst'::app_role, 2, 'view_procurement'::permission_action, true),
  ('mst'::app_role, 2, 'create_purchase_order'::permission_action, true),
  ('mst'::app_role, 2, 'view_maintenance_reports'::permission_action, true),
  ('mst'::app_role, 2, 'view_vendor_reports'::permission_action, true),
  ('mst'::app_role, 2, 'generate_reports'::permission_action, true),
  ('mst'::app_role, 2, 'export_reports'::permission_action, true),
  
  -- Tier 3: Assistant Manager
  ('assistant_manager'::app_role, 3, 'view_tickets'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'create_ticket'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'close_ticket'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'assign_ticket'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'approve_ticket_closure'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'view_requisitions'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'create_requisition'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'approve_requisition'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'reject_requisition'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'view_procurement'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'manage_vendors'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'view_maintenance_reports'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'view_vendor_reports'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'generate_reports'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'schedule_reports'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'export_reports'::permission_action, true),
  ('assistant_manager'::app_role, 3, 'view_advanced_analytics'::permission_action, true),
  
  -- Tier 6: Admin
  ('admin'::app_role, 6, 'view_tickets'::permission_action, true),
  ('admin'::app_role, 6, 'create_ticket'::permission_action, true),
  ('admin'::app_role, 6, 'close_ticket'::permission_action, true),
  ('admin'::app_role, 6, 'assign_ticket'::permission_action, true),
  ('admin'::app_role, 6, 'escalate_ticket'::permission_action, true),
  ('admin'::app_role, 6, 'approve_ticket_closure'::permission_action, true),
  ('admin'::app_role, 6, 'view_requisitions'::permission_action, true),
  ('admin'::app_role, 6, 'create_requisition'::permission_action, true),
  ('admin'::app_role, 6, 'approve_requisition'::permission_action, true),
  ('admin'::app_role, 6, 'reject_requisition'::permission_action, true),
  ('admin'::app_role, 6, 'view_procurement'::permission_action, true),
  ('admin'::app_role, 6, 'create_purchase_order'::permission_action, true),
  ('admin'::app_role, 6, 'approve_purchase'::permission_action, true),
  ('admin'::app_role, 6, 'manage_vendors'::permission_action, true),
  ('admin'::app_role, 6, 'view_maintenance_reports'::permission_action, true),
  ('admin'::app_role, 6, 'view_financial_reports'::permission_action, true),
  ('admin'::app_role, 6, 'view_executive_reports'::permission_action, true),
  ('admin'::app_role, 6, 'view_vendor_reports'::permission_action, true),
  ('admin'::app_role, 6, 'generate_reports'::permission_action, true),
  ('admin'::app_role, 6, 'schedule_reports'::permission_action, true),
  ('admin'::app_role, 6, 'export_reports'::permission_action, true),
  ('admin'::app_role, 6, 'delete_report_history'::permission_action, true),
  ('admin'::app_role, 6, 'view_basic_analytics'::permission_action, true),
  ('admin'::app_role, 6, 'view_advanced_analytics'::permission_action, true),
  ('admin'::app_role, 6, 'view_financial_analytics'::permission_action, true),
  ('admin'::app_role, 6, 'view_users'::permission_action, true),
  ('admin'::app_role, 6, 'create_users'::permission_action, true),
  ('admin'::app_role, 6, 'edit_users'::permission_action, true),
  ('admin'::app_role, 6, 'delete_users'::permission_action, true),
  ('admin'::app_role, 6, 'assign_roles'::permission_action, true),
  ('admin'::app_role, 6, 'manage_properties'::permission_action, true),
  ('admin'::app_role, 6, 'configure_system'::permission_action, true),
  ('admin'::app_role, 6, 'view_audit_logs'::permission_action, true),
  ('admin'::app_role, 6, 'manage_integrations'::permission_action, true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Check if user has specific permission
CREATE OR REPLACE FUNCTION has_permission(
  _user_id UUID,
  _property_id UUID,
  _action permission_action
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_override BOOLEAN;
  property_role app_role;
  global_role app_role;
  template_granted BOOLEAN;
BEGIN
  -- 1. Check user-specific override
  SELECT is_granted INTO user_override
  FROM user_permissions
  WHERE user_id = _user_id
    AND (property_id = _property_id OR property_id IS NULL)
    AND permission_action = _action
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY property_id NULLS LAST
  LIMIT 1;
  
  IF user_override IS NOT NULL THEN
    RETURN user_override;
  END IF;
  
  -- 2. Check property-specific role template
  SELECT role INTO property_role
  FROM property_user_roles
  WHERE user_id = _user_id
    AND property_id = _property_id
    AND is_active = true
  LIMIT 1;
  
  IF property_role IS NOT NULL THEN
    SELECT is_granted_by_default INTO template_granted
    FROM role_permission_templates
    WHERE role = property_role
      AND permission_action = _action;
    
    IF template_granted IS NOT NULL THEN
      RETURN template_granted;
    END IF;
  END IF;
  
  -- 3. Check global role template
  SELECT role INTO global_role
  FROM user_roles
  WHERE user_id = _user_id
  LIMIT 1;
  
  IF global_role IS NOT NULL THEN
    SELECT is_granted_by_default INTO template_granted
    FROM role_permission_templates
    WHERE role = global_role
      AND permission_action = _action;
    
    IF template_granted IS NOT NULL THEN
      RETURN template_granted;
    END IF;
  END IF;
  
  -- 4. Deny by default
  RETURN false;
END;
$$;

-- Get all user permissions for a property
CREATE OR REPLACE FUNCTION get_user_permissions_for_property(
  _user_id UUID,
  _property_id UUID
) RETURNS TABLE(
  action permission_action,
  is_granted BOOLEAN,
  source TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH all_permissions AS (
    SELECT DISTINCT pd.action
    FROM permission_definitions pd
  ),
  user_overrides AS (
    SELECT permission_action, is_granted
    FROM user_permissions
    WHERE user_id = _user_id
      AND (property_id = _property_id OR property_id IS NULL)
      AND (expires_at IS NULL OR expires_at > NOW())
  ),
  property_role_perms AS (
    SELECT rpt.permission_action, rpt.is_granted_by_default
    FROM property_user_roles pur
    JOIN role_permission_templates rpt ON rpt.role = pur.role
    WHERE pur.user_id = _user_id
      AND pur.property_id = _property_id
      AND pur.is_active = true
  ),
  global_role_perms AS (
    SELECT rpt.permission_action, rpt.is_granted_by_default
    FROM user_roles ur
    JOIN role_permission_templates rpt ON rpt.role = ur.role
    WHERE ur.user_id = _user_id
  )
  SELECT 
    ap.action,
    COALESCE(
      uo.is_granted,
      prp.is_granted_by_default,
      grp.is_granted_by_default,
      false
    ) as is_granted,
    CASE
      WHEN uo.is_granted IS NOT NULL THEN 'user_override'
      WHEN prp.is_granted_by_default IS NOT NULL THEN 'property_role'
      WHEN grp.is_granted_by_default IS NOT NULL THEN 'global_role'
      ELSE 'denied'
    END as source
  FROM all_permissions ap
  LEFT JOIN user_overrides uo ON uo.permission_action = ap.action
  LEFT JOIN property_role_perms prp ON prp.permission_action = ap.action
  LEFT JOIN global_role_perms grp ON grp.permission_action = ap.action;
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE permission_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view permission categories"
ON permission_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anyone can view permission definitions"
ON permission_definitions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Super admins can manage all user permissions"
ON user_permissions FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their own permissions"
ON user_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Anyone can view role templates"
ON role_permission_templates FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only super admins can manage role templates"
ON role_permission_templates FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can manage property roles"
ON property_user_roles FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their property roles"
ON property_user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view audit logs"
ON permission_audit_log FOR SELECT TO authenticated
USING (public.is_admin_secure(auth.uid()));

CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON user_permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_user_roles_updated_at
BEFORE UPDATE ON property_user_roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();