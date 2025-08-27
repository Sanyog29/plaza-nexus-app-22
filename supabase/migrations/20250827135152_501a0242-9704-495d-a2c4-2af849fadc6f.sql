-- Step 1: Create basic enums and tables only

-- Create staff group types enum
DO $$ BEGIN
    CREATE TYPE staff_group_type AS ENUM ('mst_field', 'housekeeping', 'security');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create staff availability status enum  
DO $$ BEGIN
    CREATE TYPE availability_status_type AS ENUM ('available', 'busy', 'offline', 'on_leave');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create SLA priority enum
DO $$ BEGIN
    CREATE TYPE sla_priority_type AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;