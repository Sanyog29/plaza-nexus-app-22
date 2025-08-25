
DO $$
BEGIN
  -- 1) analytics_summaries: ensure uniqueness on (summary_date, summary_type, metric_category)
  IF to_regclass('public.analytics_summaries') IS NOT NULL THEN
    -- Remove duplicates (keep latest by calculated_at; if tie, keep highest ctid)
    WITH dups AS (
      SELECT ctid,
             ROW_NUMBER() OVER (
               PARTITION BY summary_date, summary_type, metric_category
               ORDER BY calculated_at DESC NULLS LAST, ctid DESC
             ) AS rn
      FROM public.analytics_summaries
    )
    DELETE FROM public.analytics_summaries a
    USING dups
    WHERE a.ctid = dups.ctid
      AND dups.rn > 1;

    -- Add unique constraint if missing
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'analytics_summaries_summary_date_summary_type_metric_category_key'
    ) THEN
      ALTER TABLE public.analytics_summaries
      ADD CONSTRAINT analytics_summaries_summary_date_summary_type_metric_category_key
      UNIQUE (summary_date, summary_type, metric_category);
    END IF;
  END IF;

  -- 2) user_performance_scores: ensure uniqueness on (user_id, metric_date)
  IF to_regclass('public.user_performance_scores') IS NOT NULL THEN
    -- Remove duplicates (prefer latest by updated_at; if tie, highest ctid)
    WITH dups AS (
      SELECT ctid,
             ROW_NUMBER() OVER (
               PARTITION BY user_id, metric_date
               ORDER BY updated_at DESC NULLS LAST, ctid DESC
             ) AS rn
      FROM public.user_performance_scores
    )
    DELETE FROM public.user_performance_scores a
    USING dups
    WHERE a.ctid = dups.ctid
      AND dups.rn > 1;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'user_performance_scores_user_id_metric_date_key'
    ) THEN
      ALTER TABLE public.user_performance_scores
      ADD CONSTRAINT user_performance_scores_user_id_metric_date_key
      UNIQUE (user_id, metric_date);
    END IF;
  END IF;

  -- 3) vendor_analytics: ensure uniqueness on (vendor_id, metric_date)
  IF to_regclass('public.vendor_analytics') IS NOT NULL THEN
    -- Remove duplicates (prefer latest by created_at; fall back to ctid)
    WITH dups AS (
      SELECT ctid,
             ROW_NUMBER() OVER (
               PARTITION BY vendor_id, metric_date
               ORDER BY created_at DESC NULLS LAST, ctid DESC
             ) AS rn
      FROM public.vendor_analytics
    )
    DELETE FROM public.vendor_analytics a
    USING dups
    WHERE a.ctid = dups.ctid
      AND dups.rn > 1;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'vendor_analytics_vendor_id_metric_date_key'
    ) THEN
      ALTER TABLE public.vendor_analytics
      ADD CONSTRAINT vendor_analytics_vendor_id_metric_date_key
      UNIQUE (vendor_id, metric_date);
    END IF;
  END IF;

  -- 4) dietary_preferences: ensure uniqueness on (user_id)
  IF to_regclass('public.dietary_preferences') IS NOT NULL THEN
    -- Remove duplicates (prefer latest by created_at; then updated_at; fallback to ctid)
    WITH ranked AS (
      SELECT ctid,
             ROW_NUMBER() OVER (
               PARTITION BY user_id
               ORDER BY
                 created_at DESC NULLS LAST,
                 updated_at DESC NULLS LAST,
                 ctid DESC
             ) AS rn
      FROM public.dietary_preferences
    )
    DELETE FROM public.dietary_preferences a
    USING ranked
    WHERE a.ctid = ranked.ctid
      AND ranked.rn > 1;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'dietary_preferences_user_id_key'
    ) THEN
      ALTER TABLE public.dietary_preferences
      ADD CONSTRAINT dietary_preferences_user_id_key UNIQUE (user_id);
    END IF;
  END IF;
END $$;
