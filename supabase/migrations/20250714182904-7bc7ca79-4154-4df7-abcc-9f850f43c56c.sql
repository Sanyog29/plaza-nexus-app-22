-- Create tables for AI-powered system integration

-- AI Models table for storing ML model configurations
CREATE TABLE public.ai_models (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_name TEXT NOT NULL,
  model_type TEXT NOT NULL, -- 'request_routing', 'predictive_maintenance', 'sla_optimization'
  model_config JSONB NOT NULL DEFAULT '{}',
  accuracy_score DECIMAL(5,4),
  is_active BOOLEAN NOT NULL DEFAULT true,
  version TEXT NOT NULL DEFAULT '1.0',
  last_trained_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Automation Rules table for workflow automation
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'assignment', 'escalation', 'notification', 'maintenance'
  trigger_conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Real-time Events table for tracking live system events
CREATE TABLE public.real_time_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'request_created', 'status_change', 'assignment', 'alert'
  entity_type TEXT NOT NULL, -- 'request', 'user', 'asset', 'system'
  entity_id UUID,
  event_data JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'info', -- 'critical', 'warning', 'info', 'debug'
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Predictive Insights table for AI-generated predictions
CREATE TABLE public.predictive_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_type TEXT NOT NULL, -- 'workload_forecast', 'maintenance_alert', 'performance_trend'
  target_entity_type TEXT NOT NULL,
  target_entity_id UUID,
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  model_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (model_id) REFERENCES ai_models(id)
);

-- Communication Threads table for team messaging
CREATE TABLE public.communication_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_type TEXT NOT NULL, -- 'request', 'announcement', 'shift_handover', 'general'
  entity_id UUID, -- related request, asset, etc.
  subject TEXT NOT NULL,
  participants JSONB NOT NULL DEFAULT '[]', -- array of user IDs
  is_archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Communication Messages table
CREATE TABLE public.communication_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  message_content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'file', 'system'
  attachments JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  is_read_by JSONB DEFAULT '{}', -- object mapping user_id to read timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (thread_id) REFERENCES communication_threads(id) ON DELETE CASCADE
);

-- Mobile Sync Queue for offline capability
CREATE TABLE public.mobile_sync_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id UUID,
  data JSONB NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  synced_at TIMESTAMP WITH TIME ZONE
);

-- Workflow Executions table (enhance existing if needed)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workflow_executions') THEN
    CREATE TABLE public.workflow_executions (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      workflow_rule_id TEXT NOT NULL,
      trigger_context JSONB NOT NULL,
      execution_status TEXT NOT NULL DEFAULT 'running',
      execution_log JSONB DEFAULT '[]',
      started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      completed_at TIMESTAMP WITH TIME ZONE,
      error_message TEXT,
      metadata JSONB DEFAULT '{}'
    );
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_time_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_sync_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Models
CREATE POLICY "Admins can manage AI models" ON public.ai_models
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view active AI models" ON public.ai_models
  FOR SELECT USING (is_staff(auth.uid()) AND is_active = true);

-- RLS Policies for Automation Rules
CREATE POLICY "Admins can manage automation rules" ON public.automation_rules
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY "Staff can view automation rules" ON public.automation_rules
  FOR SELECT USING (is_staff(auth.uid()));

-- RLS Policies for Real-time Events
CREATE POLICY "Staff can view real-time events" ON public.real_time_events
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "System can insert real-time events" ON public.real_time_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for Predictive Insights
CREATE POLICY "Staff can view predictive insights" ON public.predictive_insights
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "System can manage predictive insights" ON public.predictive_insights
  FOR ALL USING (is_admin(auth.uid()) OR is_staff(auth.uid()));

-- RLS Policies for Communication Threads
CREATE POLICY "Users can view threads they participate in" ON public.communication_threads
  FOR SELECT USING (
    auth.uid() = created_by OR 
    participants::jsonb ? auth.uid()::text OR 
    is_staff(auth.uid())
  );

CREATE POLICY "Staff can create communication threads" ON public.communication_threads
  FOR INSERT WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Participants can update threads" ON public.communication_threads
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    participants::jsonb ? auth.uid()::text OR 
    is_staff(auth.uid())
  );

-- RLS Policies for Communication Messages
CREATE POLICY "Users can view messages in their threads" ON public.communication_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM communication_threads ct 
      WHERE ct.id = thread_id AND (
        ct.created_by = auth.uid() OR 
        ct.participants::jsonb ? auth.uid()::text OR 
        is_staff(auth.uid())
      )
    )
  );

CREATE POLICY "Users can send messages to their threads" ON public.communication_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM communication_threads ct 
      WHERE ct.id = thread_id AND (
        ct.created_by = auth.uid() OR 
        ct.participants::jsonb ? auth.uid()::text OR 
        is_staff(auth.uid())
      )
    )
  );

-- RLS Policies for Mobile Sync Queue
CREATE POLICY "Users can manage their own sync queue" ON public.mobile_sync_queue
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_ai_models_type_active ON public.ai_models(model_type, is_active);
CREATE INDEX idx_automation_rules_type_active ON public.automation_rules(rule_type, is_active);
CREATE INDEX idx_real_time_events_type_created ON public.real_time_events(event_type, created_at);
CREATE INDEX idx_predictive_insights_type_valid ON public.predictive_insights(insight_type, valid_until);
CREATE INDEX idx_communication_threads_type ON public.communication_threads(thread_type, created_at);
CREATE INDEX idx_communication_messages_thread_created ON public.communication_messages(thread_id, created_at);
CREATE INDEX idx_mobile_sync_queue_user_status ON public.mobile_sync_queue(user_id, sync_status);

-- Add realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.real_time_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.predictive_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mobile_sync_queue;

-- Set replica identity for realtime
ALTER TABLE public.real_time_events REPLICA IDENTITY FULL;
ALTER TABLE public.communication_messages REPLICA IDENTITY FULL;
ALTER TABLE public.predictive_insights REPLICA IDENTITY FULL;
ALTER TABLE public.mobile_sync_queue REPLICA IDENTITY FULL;