-- Add ML predictions with existing model IDs
WITH model_ids AS (
  SELECT id, model_name FROM ml_models ORDER BY created_at LIMIT 3
)
INSERT INTO ml_predictions (
  model_id,
  prediction_type,
  target_type,
  target_id,
  prediction_value,
  confidence_score
) 
SELECT 
  m.id,
  CASE 
    WHEN m.model_name = 'Escalation Predictor' THEN 'escalation_risk'
    WHEN m.model_name = 'Demand Forecaster' THEN 'demand_forecast'
    ELSE 'anomaly_detection'
  END,
  'maintenance_request',
  (SELECT id FROM maintenance_requests LIMIT 1),
  CASE 
    WHEN m.model_name = 'Escalation Predictor' THEN '{"escalation_probability": 0.73, "risk_level": "high"}'::jsonb
    WHEN m.model_name = 'Demand Forecaster' THEN '{"next_week_requests": 45, "peak_days": ["Monday", "Wednesday"]}'::jsonb
    ELSE '{"anomaly_score": 0.23, "status": "normal"}'::jsonb
  END,
  CASE 
    WHEN m.model_name = 'Escalation Predictor' THEN 0.73
    WHEN m.model_name = 'Demand Forecaster' THEN 0.89
    ELSE 0.91
  END
FROM model_ids m;