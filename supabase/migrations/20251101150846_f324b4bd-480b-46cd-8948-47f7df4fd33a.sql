-- Create microservices observability tables (avoiding conflicts with existing tables)

-- API Gateway Logs
CREATE TABLE IF NOT EXISTS public.gateway_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  service TEXT NOT NULL,
  latency_ms INTEGER,
  status_code INTEGER,
  error TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gateway_logs_timestamp ON public.gateway_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_gateway_logs_service ON public.gateway_logs(service);
CREATE INDEX IF NOT EXISTS idx_gateway_logs_request_id ON public.gateway_logs(request_id);

-- Domain Events (Event Store)
CREATE TABLE IF NOT EXISTS public.domain_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  domain TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_domain_events_type ON public.domain_events(event_type);
CREATE INDEX IF NOT EXISTS idx_domain_events_domain ON public.domain_events(domain);
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate ON public.domain_events(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_domain_events_created ON public.domain_events(created_at DESC);

-- Distributed Tracing
CREATE TABLE IF NOT EXISTS public.microservice_traces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trace_id TEXT NOT NULL,
  span_id TEXT NOT NULL,
  parent_span_id TEXT,
  service_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  status TEXT CHECK (status IN ('success', 'error')),
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ms_traces_trace_id ON public.microservice_traces(trace_id);
CREATE INDEX IF NOT EXISTS idx_ms_traces_service ON public.microservice_traces(service_name);
CREATE INDEX IF NOT EXISTS idx_ms_traces_timestamp ON public.microservice_traces(timestamp DESC);

-- Service Logs
CREATE TABLE IF NOT EXISTS public.microservice_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  level TEXT CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  trace_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ms_logs_service ON public.microservice_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_ms_logs_level ON public.microservice_logs(level);
CREATE INDEX IF NOT EXISTS idx_ms_logs_timestamp ON public.microservice_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ms_logs_trace_id ON public.microservice_logs(trace_id);

-- Service Metrics (renamed to avoid conflict)
CREATE TABLE IF NOT EXISTS public.microservice_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  tags JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ms_metrics_service ON public.microservice_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_ms_metrics_name ON public.microservice_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_ms_metrics_timestamp ON public.microservice_metrics(timestamp DESC);

-- Service Health Checks
CREATE TABLE IF NOT EXISTS public.microservice_health (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  checks JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ms_health_service ON public.microservice_health(service_name);
CREATE INDEX IF NOT EXISTS idx_ms_health_status ON public.microservice_health(status);
CREATE INDEX IF NOT EXISTS idx_ms_health_timestamp ON public.microservice_health(timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.gateway_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microservice_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microservice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microservice_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microservice_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view gateway logs"
  ON public.gateway_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert gateway logs"
  ON public.gateway_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can view domain events"
  ON public.domain_events FOR SELECT
  USING (public.is_admin(auth.uid()) OR public.is_staff(auth.uid()));

CREATE POLICY "Service role can insert domain events"
  ON public.domain_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view traces"
  ON public.microservice_traces FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert traces"
  ON public.microservice_traces FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view logs"
  ON public.microservice_logs FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert logs"
  ON public.microservice_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view metrics"
  ON public.microservice_metrics FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert metrics"
  ON public.microservice_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view health"
  ON public.microservice_health FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert health"
  ON public.microservice_health FOR INSERT
  WITH CHECK (true);