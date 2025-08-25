-- Ensure unique constraints for ON CONFLICT targets and clean duplicates
DO $$
BEGIN
  -- performance_metrics: expect one row per metric_date
  IF to_regclass('public.performance_metrics') IS NOT NULL THEN
    -- Remove duplicates keeping most recent calculated_at
    WITH ranked AS (
      SELECT ctid,
             ROW_NUMBER() OVER (
               PARTITION BY metric_date
               ORDER BY calculated_at DESC NULLS LAST, ctid DESC
             ) AS rn
      FROM public.performance_metrics
    )
    DELETE FROM public.performance_metrics pm
    USING ranked r
    WHERE pm.ctid = r.ctid AND r.rn > 1;

    -- Add unique constraint if missing
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'performance_metrics_metric_date_key'
    ) THEN
      ALTER TABLE public.performance_metrics
      ADD CONSTRAINT performance_metrics_metric_date_key UNIQUE (metric_date);
    END IF;
  END IF;

  -- Safety re-checks for previous constraints (idempotent)
  IF to_regclass('public.analytics_summaries') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'analytics_summaries_summary_date_summary_type_metric_category_key'
    ) THEN
      ALTER TABLE public.analytics_summaries
      ADD CONSTRAINT analytics_summaries_summary_date_summary_type_metric_category_key
      UNIQUE (summary_date, summary_type, metric_category);
    END IF;
  END IF;

  IF to_regclass('public.user_performance_scores') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'user_performance_scores_user_id_metric_date_key'
    ) THEN
      ALTER TABLE public.user_performance_scores
      ADD CONSTRAINT user_performance_scores_user_id_metric_date_key
      UNIQUE (user_id, metric_date);
    END IF;
  END IF;

  IF to_regclass('public.vendor_analytics') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'vendor_analytics_vendor_id_metric_date_key'
    ) THEN
      ALTER TABLE public.vendor_analytics
      ADD CONSTRAINT vendor_analytics_vendor_id_metric_date_key
      UNIQUE (vendor_id, metric_date);
    END IF;
  END IF;

  IF to_regclass('public.dietary_preferences') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'dietary_preferences_user_id_key'
    ) THEN
      ALTER TABLE public.dietary_preferences
      ADD CONSTRAINT dietary_preferences_user_id_key UNIQUE (user_id);
    END IF;
  END IF;
END $$;