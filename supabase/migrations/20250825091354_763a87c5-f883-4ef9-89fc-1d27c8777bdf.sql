-- Fix missing unique constraints with IF NOT EXISTS to prevent duplicate key errors

-- Add unique constraint to dietary_preferences if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'dietary_preferences_user_id_key'
    ) THEN
        ALTER TABLE public.dietary_preferences 
        ADD CONSTRAINT dietary_preferences_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Add unique constraint to analytics_summaries if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'analytics_summaries_summary_date_summary_type_metric_category_key'
    ) THEN
        ALTER TABLE public.analytics_summaries 
        ADD CONSTRAINT analytics_summaries_summary_date_summary_type_metric_category_key 
        UNIQUE (summary_date, summary_type, metric_category);
    END IF;
END $$;

-- Add unique constraint to vendor_analytics if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vendor_analytics_vendor_id_metric_date_key'
    ) THEN
        ALTER TABLE public.vendor_analytics 
        ADD CONSTRAINT vendor_analytics_vendor_id_metric_date_key 
        UNIQUE (vendor_id, metric_date);
    END IF;
END $$;

-- Add unique constraint to user_performance_scores if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_performance_scores_user_id_metric_date_key'
    ) THEN
        ALTER TABLE public.user_performance_scores 
        ADD CONSTRAINT user_performance_scores_user_id_metric_date_key 
        UNIQUE (user_id, metric_date);
    END IF;
END $$;

-- Clean up any duplicate entries that might prevent constraint creation
-- Remove duplicate dietary_preferences (keep the most recent)
DELETE FROM public.dietary_preferences dp1 
WHERE EXISTS (
    SELECT 1 FROM public.dietary_preferences dp2 
    WHERE dp2.user_id = dp1.user_id 
    AND dp2.created_at > dp1.created_at
);

-- Remove duplicate analytics_summaries (keep the most recent)
DELETE FROM public.analytics_summaries as1 
WHERE EXISTS (
    SELECT 1 FROM public.analytics_summaries as2 
    WHERE as2.summary_date = as1.summary_date 
    AND as2.summary_type = as1.summary_type 
    AND as2.metric_category = as1.metric_category 
    AND as2.calculated_at > as1.calculated_at
);

-- Remove duplicate vendor_analytics (keep the most recent)
DELETE FROM public.vendor_analytics va1 
WHERE EXISTS (
    SELECT 1 FROM public.vendor_analytics va2 
    WHERE va2.vendor_id = va1.vendor_id 
    AND va2.metric_date = va1.metric_date 
    AND va2.created_at > va1.created_at
);

-- Remove duplicate user_performance_scores (keep the most recent)
DELETE FROM public.user_performance_scores ups1 
WHERE EXISTS (
    SELECT 1 FROM public.user_performance_scores ups2 
    WHERE ups2.user_id = ups1.user_id 
    AND ups2.metric_date = ups1.metric_date 
    AND ups2.updated_at > ups1.updated_at
);