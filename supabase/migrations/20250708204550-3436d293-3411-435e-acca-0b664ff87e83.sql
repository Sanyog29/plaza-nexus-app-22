
-- Create system configuration tables
CREATE TABLE system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL,
  data_type text NOT NULL DEFAULT 'string',
  description text,
  is_encrypted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(category, key)
);

-- Create content management tables
CREATE TABLE content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES content_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  content_type text NOT NULL DEFAULT 'text',
  file_url text,
  file_size integer,
  version integer DEFAULT 1,
  is_published boolean DEFAULT false,
  published_at timestamp with time zone,
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create audit logs table for better tracking
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
CREATE POLICY "Admins can manage system settings" ON system_settings
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view non-encrypted settings" ON system_settings
  FOR SELECT USING (is_staff(auth.uid()) AND NOT is_encrypted);

-- RLS Policies for content_categories
CREATE POLICY "Anyone can view active content categories" ON content_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage content categories" ON content_categories
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for content_items
CREATE POLICY "Anyone can view published content" ON content_items
  FOR SELECT USING (is_published = true);

CREATE POLICY "Staff can view all content" ON content_items
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Admins can manage content" ON content_items
  FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Functions for system settings management
CREATE OR REPLACE FUNCTION get_system_setting(setting_category text, setting_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  setting_value jsonb;
BEGIN
  SELECT value INTO setting_value
  FROM system_settings
  WHERE category = setting_category AND key = setting_key;
  
  RETURN COALESCE(setting_value, 'null'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION set_system_setting(
  setting_category text,
  setting_key text,
  setting_value jsonb,
  setting_type text DEFAULT 'string',
  setting_description text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
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
$$;

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  action_type text,
  resource_type text,
  resource_id uuid DEFAULT NULL,
  old_values jsonb DEFAULT NULL,
  new_values jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
  VALUES (auth.uid(), action_type, resource_type, resource_id, old_values, new_values)
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_categories_updated_at
  BEFORE UPDATE ON content_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system settings
INSERT INTO system_settings (category, key, value, data_type, description) VALUES
('maintenance', 'autoAssignment', 'true', 'boolean', 'Automatically assign requests to available staff'),
('maintenance', 'defaultSlaHours', '24', 'number', 'Default SLA time for new requests'),
('maintenance', 'escalationEnabled', 'true', 'boolean', 'Enable automatic escalation for overdue requests'),
('maintenance', 'notificationEmail', '"admin@ssplaza.com"', 'string', 'Email for system notifications'),
('security', 'sessionTimeout', '60', 'number', 'Session timeout in minutes'),
('security', 'maxLoginAttempts', '5', 'number', 'Maximum login attempts before lockout'),
('security', 'requirePasswordChange', 'false', 'boolean', 'Force users to change password on first login'),
('security', 'twoFactorEnabled', 'false', 'boolean', 'Enable 2FA for admin accounts'),
('notifications', 'emailEnabled', 'true', 'boolean', 'Send email alerts for critical events'),
('notifications', 'smsEnabled', 'false', 'boolean', 'Send SMS for urgent alerts'),
('notifications', 'pushEnabled', 'true', 'boolean', 'Browser and mobile push notifications'),
('notifications', 'alertThreshold', '5', 'number', 'Number of overdue requests to trigger alert'),
('system', 'maintenanceMode', 'false', 'boolean', 'Put system in maintenance mode'),
('system', 'debugMode', 'false', 'boolean', 'Enable detailed logging for debugging'),
('system', 'backupFrequency', '"daily"', 'string', 'Frequency of automated backups'),
('system', 'logRetention', '30', 'number', 'Number of days to retain logs');

-- Insert default content categories
INSERT INTO content_categories (name, description, icon, display_order) VALUES
('Announcements', 'Important announcements and updates', 'megaphone', 1),
('Policies', 'Company policies and procedures', 'shield-check', 2),
('Procedures', 'Step-by-step procedures', 'list-checks', 3),
('Training', 'Training materials and resources', 'graduation-cap', 4),
('Emergency', 'Emergency procedures and contacts', 'alert-triangle', 5);
