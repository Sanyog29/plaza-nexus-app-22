-- Enhanced ticket management system implementation (corrected)

-- Create staff group types enum (without IF NOT EXISTS)
DO $$ BEGIN
    CREATE TYPE staff_group_type AS ENUM ('mst_field', 'housekeeping', 'security');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create staff availability status enum  
DO $$ BEGIN
    CREATE TYPE availability_status_type AS ENUM ('available', 'busy', 'offline', 'on_leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create SLA priority enum with specific timings
DO $$ BEGIN
    CREATE TYPE sla_priority_type AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- SLA configuration table (create first)
CREATE TABLE IF NOT EXISTS sla_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  priority sla_priority_type NOT NULL,
  response_time_minutes INTEGER NOT NULL,
  resolution_time_hours INTEGER NOT NULL,
  escalation_intervals_minutes INTEGER[] NOT NULL DEFAULT '{10, 30, 60}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(priority)
);

-- Enhanced staff availability table
CREATE TABLE IF NOT EXISTS staff_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  availability_status availability_status_type NOT NULL DEFAULT 'available',
  last_status_change TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  auto_offline_at TIMESTAMP WITH TIME ZONE,
  staff_group staff_group_type,
  specialization TEXT[], -- specific skills like 'hvac', 'electrical', etc.
  current_workload INTEGER NOT NULL DEFAULT 0,
  max_concurrent_tickets INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id)
);

-- Staff groups table for better organization
CREATE TABLE IF NOT EXISTS staff_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name staff_group_type NOT NULL,
  group_description TEXT,
  escalation_chain JSONB NOT NULL DEFAULT '[]', -- Array of role levels for escalation
  response_sla_minutes INTEGER NOT NULL DEFAULT 30,
  resolution_sla_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_name)
);

-- Crisis keywords table for automatic crisis detection
CREATE TABLE IF NOT EXISTS crisis_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  category TEXT,
  severity_score INTEGER NOT NULL DEFAULT 1,
  auto_escalate_to_level INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(keyword)
);

-- Ticket assignment attempts log
CREATE TABLE IF NOT EXISTS ticket_assignment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  attempted_staff_id UUID REFERENCES profiles(id),
  staff_group staff_group_type,
  attempt_reason TEXT NOT NULL,
  attempt_result TEXT NOT NULL, -- 'assigned', 'unavailable', 'overloaded', 'no_skills'
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced category group mappings with priorities
ALTER TABLE category_group_mappings 
ADD COLUMN IF NOT EXISTS staff_group staff_group_type,
ADD COLUMN IF NOT EXISTS auto_assignment_priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS required_specializations TEXT[] DEFAULT '{}';

-- Enhanced maintenance requests with crisis handling
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS is_crisis BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS crisis_detected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS staff_group staff_group_type,
ADD COLUMN IF NOT EXISTS response_sla_breach_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_assigned_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS acknowledgment_deadline TIMESTAMP WITH TIME ZONE;

-- NOW INSERT DEFAULT DATA (after tables are created)

-- Insert default SLA configurations
INSERT INTO sla_configurations (priority, response_time_minutes, resolution_time_hours, escalation_intervals_minutes) VALUES
('critical', 10, 2, '{5, 10, 15}'),
('high', 30, 4, '{10, 20, 30}'),
('medium', 60, 12, '{30, 60, 120}'),
('low', 120, 48, '{60, 120, 240}')
ON CONFLICT (priority) DO UPDATE SET
  response_time_minutes = EXCLUDED.response_time_minutes,
  resolution_time_hours = EXCLUDED.resolution_time_hours,
  escalation_intervals_minutes = EXCLUDED.escalation_intervals_minutes;

-- Insert default staff groups
INSERT INTO staff_groups (group_name, group_description, escalation_chain, response_sla_minutes, resolution_sla_hours) VALUES
('mst_field', 'MST & Field Staff - HVAC, Electrical, Plumbing, IT, Lifts, Building Services', 
 '["mst", "fe", "assistant_manager", "assistant_general_manager", "vp"]', 30, 24),
('housekeeping', 'Housekeeping & Cleaning, Pantry & F&B, Environment', 
 '["hk", "assistant_floor_manager", "assistant_manager", "assistant_general_manager", "vp"]', 20, 12),
('security', 'Security & Access Control, CCTV, Security Incidents', 
 '["se", "assistant_manager", "assistant_general_manager", "assistant_vice_president", "ceo"]', 15, 8)
ON CONFLICT (group_name) DO UPDATE SET
  group_description = EXCLUDED.group_description,
  escalation_chain = EXCLUDED.escalation_chain;

-- Insert crisis keywords
INSERT INTO crisis_keywords (keyword, category, severity_score, auto_escalate_to_level) VALUES
('fire', 'emergency', 10, 5),
('smoke', 'emergency', 9, 5),
('gas leak', 'emergency', 10, 5),
('power outage', 'critical', 8, 4),
('elevator stuck', 'emergency', 9, 5),
('flooding', 'emergency', 10, 5),
('security breach', 'emergency', 9, 5),
('medical emergency', 'emergency', 10, 5),
('system down', 'critical', 7, 4),
('no water', 'critical', 8, 4)
ON CONFLICT (keyword) DO NOTHING;

-- Function to update staff availability
CREATE OR REPLACE FUNCTION update_staff_availability(
  new_status availability_status_type,
  auto_offline_minutes INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auto_offline_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate auto offline time if provided
  IF auto_offline_minutes IS NOT NULL AND auto_offline_minutes > 0 THEN
    auto_offline_time := NOW() + (auto_offline_minutes || ' minutes')::INTERVAL;
  END IF;

  -- Insert or update staff availability
  INSERT INTO staff_availability (staff_id, availability_status, is_available, auto_offline_at, last_status_change)
  VALUES (
    auth.uid(), 
    new_status, 
    CASE WHEN new_status = 'available' THEN true ELSE false END,
    auto_offline_time,
    NOW()
  )
  ON CONFLICT (staff_id) DO UPDATE SET
    availability_status = EXCLUDED.availability_status,
    is_available = EXCLUDED.is_available,
    auto_offline_at = EXCLUDED.auto_offline_at,
    last_status_change = EXCLUDED.last_status_change,
    updated_at = NOW();

  RETURN TRUE;
END;
$$;

-- Function to detect crisis keywords
CREATE OR REPLACE FUNCTION detect_crisis_in_request()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  crisis_found BOOLEAN := false;
  keyword_record RECORD;
  total_severity INTEGER := 0;
BEGIN
  -- Check for crisis keywords in title and description
  FOR keyword_record IN 
    SELECT * FROM crisis_keywords 
  LOOP
    IF (LOWER(NEW.title) LIKE '%' || LOWER(keyword_record.keyword) || '%' OR 
        LOWER(COALESCE(NEW.description, '')) LIKE '%' || LOWER(keyword_record.keyword) || '%') THEN
      crisis_found := true;
      total_severity := total_severity + keyword_record.severity_score;
    END IF;
  END LOOP;

  -- Mark as crisis if keywords found or severity exceeds threshold
  IF crisis_found OR total_severity >= 8 THEN
    NEW.is_crisis := true;
    NEW.crisis_detected_at := NOW();
    NEW.priority := 'critical';
    NEW.escalation_level := 5;
  END IF;

  RETURN NEW;
END;
$$;

-- Enhanced SLA calculation function
CREATE OR REPLACE FUNCTION calculate_enhanced_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  sla_config RECORD;
BEGIN
  -- Get SLA configuration for the priority
  SELECT * INTO sla_config 
  FROM sla_configurations 
  WHERE priority = NEW.priority::sla_priority_type;
  
  IF FOUND THEN
    -- Set response SLA breach time
    NEW.response_sla_breach_at := NEW.created_at + (sla_config.response_time_minutes || ' minutes')::INTERVAL;
    
    -- Set resolution SLA breach time  
    NEW.sla_breach_at := NEW.created_at + (sla_config.resolution_time_hours || ' hours')::INTERVAL;
    
    -- Set acknowledgment deadline (10 minutes for assignment acknowledgment)
    NEW.acknowledgment_deadline := NEW.created_at + INTERVAL '10 minutes';
    
    -- Set next escalation time based on first escalation interval
    IF array_length(sla_config.escalation_intervals_minutes, 1) > 0 THEN
      NEW.next_escalation_at := NEW.created_at + (sla_config.escalation_intervals_minutes[1] || ' minutes')::INTERVAL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS detect_crisis_trigger ON maintenance_requests;
CREATE TRIGGER detect_crisis_trigger
  BEFORE INSERT OR UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION detect_crisis_in_request();

DROP TRIGGER IF EXISTS calculate_request_sla_trigger ON maintenance_requests;
DROP TRIGGER IF EXISTS calculate_enhanced_sla_trigger ON maintenance_requests;
CREATE TRIGGER calculate_enhanced_sla_trigger
  BEFORE INSERT ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION calculate_enhanced_sla();

-- Enable RLS on new tables
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_assignment_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can manage their own availability" ON staff_availability
  FOR ALL USING (staff_id = auth.uid());

CREATE POLICY "Staff can view all availability" ON staff_availability
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view staff groups" ON staff_groups
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view SLA configurations" ON sla_configurations
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view crisis keywords" ON crisis_keywords
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can view assignment attempts" ON ticket_assignment_attempts
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "System can log assignment attempts" ON ticket_assignment_attempts
  FOR INSERT WITH CHECK (true);