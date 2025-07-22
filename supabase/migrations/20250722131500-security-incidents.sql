-- Create security incidents table for non-visitor related security events
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('security_incident', 'emergency_alert', 'access_denied', 'policy_violation')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  reported_by UUID REFERENCES public.profiles(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can view security incidents" 
ON public.security_incidents 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'ops_supervisor', 'site_manager', 'field_staff')
  )
);

CREATE POLICY "Staff can create security incidents" 
ON public.security_incidents 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'ops_supervisor', 'site_manager', 'field_staff')
  )
);

CREATE POLICY "Supervisors can update security incidents" 
ON public.security_incidents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'ops_supervisor', 'site_manager')
  )
);

-- Create indexes for performance
CREATE INDEX idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_security_incidents_timestamp ON public.security_incidents(timestamp);
CREATE INDEX idx_security_incidents_reported_by ON public.security_incidents(reported_by);