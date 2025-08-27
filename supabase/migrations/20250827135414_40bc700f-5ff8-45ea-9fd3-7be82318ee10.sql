-- Step 2: Create core tables for the enhanced ticket management system

-- SLA configuration table
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
  specialization TEXT[],
  current_workload INTEGER NOT NULL DEFAULT 0,
  max_concurrent_tickets INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id)
);

-- Staff groups table
CREATE TABLE IF NOT EXISTS staff_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name staff_group_type NOT NULL,
  group_description TEXT,
  escalation_chain JSONB NOT NULL DEFAULT '[]',
  response_sla_minutes INTEGER NOT NULL DEFAULT 30,
  resolution_sla_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_name)
);

-- Crisis keywords table
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
  attempt_result TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE sla_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_assignment_attempts ENABLE ROW LEVEL SECURITY;