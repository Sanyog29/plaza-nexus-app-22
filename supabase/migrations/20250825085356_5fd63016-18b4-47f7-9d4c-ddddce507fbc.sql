-- Add unique constraint on user_id for dietary_preferences table
-- This will fix the ON CONFLICT error when upserting dietary preferences

ALTER TABLE dietary_preferences 
ADD CONSTRAINT dietary_preferences_user_id_unique UNIQUE (user_id);