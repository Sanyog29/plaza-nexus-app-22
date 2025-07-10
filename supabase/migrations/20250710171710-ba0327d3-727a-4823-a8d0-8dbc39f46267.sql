-- Phase 1 Continued: Enable realtime (only if not already enabled)

DO $$
BEGIN
    -- Add tables to realtime publication only if they're not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'visitors'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE visitors;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'task_assignments'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE task_assignments;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'staff_attendance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE staff_attendance;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors, tables might already be in publication
        NULL;
END
$$;