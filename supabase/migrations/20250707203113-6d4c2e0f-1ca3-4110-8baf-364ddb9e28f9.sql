-- Create escalation_logs table referenced by existing functions
CREATE TABLE IF NOT EXISTS public.escalation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  escalation_type TEXT NOT NULL,
  escalated_from UUID REFERENCES profiles(id) ON DELETE SET NULL,
  escalated_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  penalty_amount DECIMAL(10,2) DEFAULT 0,
  escalation_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.escalation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Staff can view escalation logs" 
ON public.escalation_logs 
FOR SELECT 
USING (is_staff(auth.uid()));

-- Add sample visitor data for analytics
INSERT INTO public.visitor_categories (name, description, color, icon) VALUES
  ('Business Meeting', 'Corporate visitors and business meetings', '#3B82F6', 'briefcase'),
  ('Vendor', 'Service providers and vendors', '#10B981', 'truck'),
  ('Guest', 'Personal guests and visitors', '#F59E0B', 'user'),
  ('Interview', 'Job candidates and interviews', '#8B5CF6', 'user-plus')
ON CONFLICT DO NOTHING;

-- Add sample visitors (only if table is empty)
INSERT INTO public.visitors (
  name, company, contact_number, visit_date, entry_time, 
  visit_purpose, host_id, category_id, status, access_level
)
SELECT 
  'John Smith', 'Tech Corp', '+1234567890',
  CURRENT_DATE, '09:00', 'Business meeting', 
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  (SELECT id FROM visitor_categories WHERE name = 'Business Meeting' LIMIT 1),
  'checked_out', 'restricted'
WHERE NOT EXISTS (SELECT 1 FROM visitors LIMIT 1);

INSERT INTO public.visitors (
  name, company, contact_number, visit_date, entry_time,
  visit_purpose, host_id, category_id, status, access_level
)
SELECT 
  'Sarah Johnson', 'Design Studio', '+1234567891',
  CURRENT_DATE, '10:30', 'Project discussion',
  (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
  (SELECT id FROM visitor_categories WHERE name = 'Business Meeting' LIMIT 1),
  'checked_in', 'general'
WHERE (SELECT COUNT(*) FROM visitors) < 2;

-- Add triggers for updated_at
CREATE OR REPLACE TRIGGER update_escalation_logs_updated_at
  BEFORE UPDATE ON public.escalation_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();