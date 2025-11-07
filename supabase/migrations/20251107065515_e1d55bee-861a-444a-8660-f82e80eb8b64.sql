-- Create property_approvers table
CREATE TABLE property_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  approver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approver_role_title TEXT,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partial unique index for only one active approver per property
CREATE UNIQUE INDEX idx_property_approvers_unique_active 
  ON property_approvers(property_id) 
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE property_approvers ENABLE ROW LEVEL SECURITY;

-- Super admins can manage approvers
CREATE POLICY "Super admins manage approvers"
  ON property_approvers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Users can view their own assignments
CREATE POLICY "Users view their assignments"
  ON property_approvers FOR SELECT TO authenticated
  USING (approver_user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_property_approvers_property ON property_approvers(property_id);
CREATE INDEX idx_property_approvers_user ON property_approvers(approver_user_id);
CREATE INDEX idx_property_approvers_active ON property_approvers(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_property_approvers_updated_at
  BEFORE UPDATE ON property_approvers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();