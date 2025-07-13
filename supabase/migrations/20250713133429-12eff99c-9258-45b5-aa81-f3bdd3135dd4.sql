-- Phase 4: Advanced Integration & Automation Hub Database Schema

-- Workflow execution engine
CREATE TABLE public.workflow_executions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_rule_id TEXT NOT NULL,
    trigger_context JSONB NOT NULL,
    execution_status TEXT NOT NULL DEFAULT 'running',
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    execution_log JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Machine learning models and predictions
CREATE TABLE public.ml_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_name TEXT NOT NULL UNIQUE,
    model_type TEXT NOT NULL, -- 'failure_prediction', 'demand_forecast', 'anomaly_detection'
    version TEXT NOT NULL DEFAULT '1.0',
    accuracy_score DECIMAL(5,4),
    last_trained_at TIMESTAMP WITH TIME ZONE,
    model_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ML predictions and recommendations
CREATE TABLE public.ml_predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model_id UUID NOT NULL REFERENCES public.ml_models(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL, -- 'asset', 'request', 'resource'
    target_id UUID,
    prediction_type TEXT NOT NULL,
    prediction_value JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    prediction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    actual_outcome JSONB,
    is_validated BOOLEAN DEFAULT false
);

-- External system integrations
CREATE TABLE public.external_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_name TEXT NOT NULL UNIQUE,
    integration_type TEXT NOT NULL, -- 'cmms', 'iot', 'weather', 'supplier'
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'active',
    error_count INTEGER DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- IoT sensor data
CREATE TABLE public.iot_sensor_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    location TEXT NOT NULL,
    reading_value DECIMAL(10,4) NOT NULL,
    unit TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_anomaly BOOLEAN DEFAULT false
);

-- Executive reports and insights
CREATE TABLE public.executive_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_type TEXT NOT NULL,
    report_period TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    report_data JSONB NOT NULL,
    ai_insights JSONB DEFAULT '[]'::jsonb,
    file_url TEXT,
    generated_by UUID REFERENCES public.profiles(id),
    is_automated BOOLEAN DEFAULT false
);

-- KPI tracking and thresholds
CREATE TABLE public.kpi_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_category TEXT NOT NULL,
    current_value DECIMAL(10,4) NOT NULL,
    target_value DECIMAL(10,4),
    threshold_min DECIMAL(10,4),
    threshold_max DECIMAL(10,4),
    unit TEXT,
    calculation_method TEXT,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_critical BOOLEAN DEFAULT false
);

-- Resource optimization recommendations
CREATE TABLE public.optimization_recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recommendation_type TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    potential_savings DECIMAL(10,2),
    implementation_effort TEXT,
    confidence_score DECIMAL(5,4),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    implemented_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on all tables
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iot_sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executive_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for staff access
CREATE POLICY "Staff can view workflow executions" ON public.workflow_executions FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view ML models" ON public.ml_models FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view ML predictions" ON public.ml_predictions FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage external integrations" ON public.external_integrations FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view external integrations" ON public.external_integrations FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view IoT sensor data" ON public.iot_sensor_data FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can view executive reports" ON public.executive_reports FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage executive reports" ON public.executive_reports FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view KPI metrics" ON public.kpi_metrics FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage KPI metrics" ON public.kpi_metrics FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can view optimization recommendations" ON public.optimization_recommendations FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Admins can manage optimization recommendations" ON public.optimization_recommendations FOR ALL USING (is_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(execution_status);
CREATE INDEX idx_workflow_executions_started ON public.workflow_executions(started_at);
CREATE INDEX idx_ml_predictions_model ON public.ml_predictions(model_id);
CREATE INDEX idx_ml_predictions_target ON public.ml_predictions(target_type, target_id);
CREATE INDEX idx_iot_sensor_timestamp ON public.iot_sensor_data(timestamp);
CREATE INDEX idx_iot_sensor_device ON public.iot_sensor_data(device_id);
CREATE INDEX idx_executive_reports_type ON public.executive_reports(report_type);
CREATE INDEX idx_kpi_metrics_category ON public.kpi_metrics(metric_category);
CREATE INDEX idx_optimization_priority ON public.optimization_recommendations(priority);

-- Insert sample ML models
INSERT INTO public.ml_models (model_name, model_type, accuracy_score, model_config) VALUES
('Equipment Failure Predictor', 'failure_prediction', 0.8542, '{"algorithm": "random_forest", "features": ["age", "usage_hours", "maintenance_history"]}'),
('Demand Forecaster', 'demand_forecast', 0.7834, '{"algorithm": "arima", "horizon": 30, "seasonality": "weekly"}'),
('Anomaly Detector', 'anomaly_detection', 0.9123, '{"algorithm": "isolation_forest", "threshold": 0.1}');

-- Insert sample KPI metrics
INSERT INTO public.kpi_metrics (metric_name, metric_category, current_value, target_value, threshold_min, threshold_max, unit) VALUES
('Average Response Time', 'performance', 2.5, 2.0, 0.5, 4.0, 'hours'),
('SLA Compliance Rate', 'compliance', 92.3, 95.0, 85.0, 100.0, 'percentage'),
('Equipment Uptime', 'reliability', 98.1, 99.0, 95.0, 100.0, 'percentage'),
('Cost per Square Foot', 'financial', 12.45, 11.00, 8.00, 15.00, 'currency'),
('Energy Efficiency Score', 'sustainability', 87.2, 90.0, 70.0, 100.0, 'score');

-- Create function for automatic workflow execution logging
CREATE OR REPLACE FUNCTION public.log_workflow_execution(
    rule_id TEXT,
    context JSONB,
    log_entry JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    execution_id UUID;
BEGIN
    INSERT INTO public.workflow_executions (workflow_rule_id, trigger_context, execution_log)
    VALUES (rule_id, context, JSONB_BUILD_ARRAY(log_entry))
    RETURNING id INTO execution_id;
    
    RETURN execution_id;
END;
$$;