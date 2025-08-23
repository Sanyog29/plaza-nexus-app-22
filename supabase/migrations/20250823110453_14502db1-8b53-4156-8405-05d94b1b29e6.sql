-- Create staff availability tracking table
CREATE TABLE public.staff_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'offline', 'on_leave')),
  last_status_change TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  auto_offline_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id)
);

-- Enable RLS on staff availability
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;

-- Create staff availability policies
CREATE POLICY "Staff can manage their own availability"
ON public.staff_availability
FOR ALL
USING (staff_id = auth.uid() OR is_staff(auth.uid()));

-- Create staff groups table for categorization mapping
CREATE TABLE public.staff_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL UNIQUE,
  group_type TEXT NOT NULL CHECK (group_type IN ('mst', 'housekeeping', 'security')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on staff groups
ALTER TABLE public.staff_groups ENABLE ROW LEVEL SECURITY;

-- Create staff groups policies
CREATE POLICY "Staff can view groups"
ON public.staff_groups
FOR SELECT
USING (is_staff(auth.uid()));

-- Create staff group assignments table
CREATE TABLE public.staff_group_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.staff_groups(id) ON DELETE CASCADE,
  staff_level INTEGER NOT NULL DEFAULT 1 CHECK (staff_level IN (1, 2)),
  is_backup BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, group_id)
);

-- Enable RLS on staff group assignments
ALTER TABLE public.staff_group_assignments ENABLE ROW LEVEL SECURITY;

-- Create staff group assignments policies
CREATE POLICY "Staff can view group assignments"
ON public.staff_group_assignments
FOR SELECT
USING (is_staff(auth.uid()));

-- Add new columns to maintenance_requests table (checking if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'assigned_group') THEN
        ALTER TABLE public.maintenance_requests ADD COLUMN assigned_group UUID REFERENCES public.staff_groups(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'assignment_acknowledged_at') THEN
        ALTER TABLE public.maintenance_requests ADD COLUMN assignment_acknowledged_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'is_crisis') THEN
        ALTER TABLE public.maintenance_requests ADD COLUMN is_crisis BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'next_escalation_at') THEN
        ALTER TABLE public.maintenance_requests ADD COLUMN next_escalation_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_requests' AND column_name = 'auto_assignment_attempts') THEN
        ALTER TABLE public.maintenance_requests ADD COLUMN auto_assignment_attempts INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Create ticket assignment history table
CREATE TABLE public.ticket_assignment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES public.profiles(id),
  assigned_by UUID REFERENCES public.profiles(id),
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('auto', 'manual', 'escalation', 'reassignment')),
  assignment_reason TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  unassigned_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on ticket assignment history
ALTER TABLE public.ticket_assignment_history ENABLE ROW LEVEL SECURITY;

-- Create ticket assignment history policies
CREATE POLICY "Staff can view assignment history"
ON public.ticket_assignment_history
FOR SELECT
USING (is_staff(auth.uid()));

-- Create category group mapping table
CREATE TABLE public.category_group_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.maintenance_categories(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES public.staff_groups(id) ON DELETE CASCADE,
  priority_override TEXT CHECK (priority_override IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, group_id)
);

-- Enable RLS on category group mappings
ALTER TABLE public.category_group_mappings ENABLE ROW LEVEL SECURITY;

-- Create category group mappings policies
CREATE POLICY "Staff can view category mappings"
ON public.category_group_mappings
FOR SELECT
USING (is_staff(auth.uid()));

-- Insert default staff groups
INSERT INTO public.staff_groups (group_name, group_type, description) VALUES
('MST & Field Staff', 'mst', 'Handles HVAC, Electrical, Plumbing, IT, Lifts, Building Services'),
('Housekeeping', 'housekeeping', 'Responsible for Cleaning, Pantry, F&B, Environment'),
('Security', 'security', 'Manages Security, Access Control, CCTV');

-- Create function to auto-assign tickets based on category
CREATE OR REPLACE FUNCTION public.auto_assign_ticket_by_category()
RETURNS TRIGGER AS $$
DECLARE
  target_group_id UUID;
  available_staff_id UUID;
BEGIN
  -- Skip if already assigned or is update
  IF NEW.assigned_to IS NOT NULL OR TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;
  
  -- Get the target group for this category
  SELECT sg.id INTO target_group_id
  FROM public.staff_groups sg
  JOIN public.category_group_mappings cgm ON sg.id = cgm.group_id
  WHERE cgm.category_id = NEW.category_id
  LIMIT 1;
  
  -- Set the assigned group
  NEW.assigned_group := target_group_id;
  
  -- If crisis, escalate immediately
  IF NEW.is_crisis THEN
    NEW.escalation_level := 5;
    NEW.next_escalation_at := NOW() + INTERVAL '5 minutes';
    RETURN NEW;
  END IF;
  
  -- Find available L1 staff in the group
  SELECT p.id INTO available_staff_id
  FROM public.profiles p
  JOIN public.staff_group_assignments sga ON p.id = sga.staff_id
  JOIN public.staff_availability sa ON p.id = sa.staff_id
  WHERE sga.group_id = target_group_id
    AND sga.staff_level = 1
    AND sa.is_available = true
    AND sa.availability_status = 'available'
  ORDER BY RANDOM()
  LIMIT 1;
  
  -- Assign to available staff if found
  IF available_staff_id IS NOT NULL THEN
    NEW.assigned_to := available_staff_id;
    NEW.next_escalation_at := NOW() + INTERVAL '10 minutes'; -- 10 min to acknowledge
  ELSE
    -- No L1 available, escalate to L2
    NEW.escalation_level := 2;
    NEW.next_escalation_at := NOW() + INTERVAL '10 minutes';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment (drop if exists)
DROP TRIGGER IF EXISTS auto_assign_ticket_trigger ON public.maintenance_requests;
CREATE TRIGGER auto_assign_ticket_trigger
  BEFORE INSERT ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_ticket_by_category();

-- Create function to handle ticket acknowledgment
CREATE OR REPLACE FUNCTION public.acknowledge_ticket(ticket_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is assigned to this ticket
  IF NOT EXISTS (
    SELECT 1 FROM public.maintenance_requests 
    WHERE id = ticket_id AND assigned_to = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to acknowledge this ticket';
  END IF;
  
  -- Update acknowledgment
  UPDATE public.maintenance_requests
  SET assignment_acknowledged_at = NOW(),
      next_escalation_at = CASE 
        WHEN priority = 'critical' THEN NOW() + INTERVAL '2 hours'
        WHEN priority = 'high' THEN NOW() + INTERVAL '4 hours'
        WHEN priority = 'medium' THEN NOW() + INTERVAL '12 hours'
        ELSE NOW() + INTERVAL '48 hours'
      END,
      updated_at = NOW()
  WHERE id = ticket_id;
  
  -- Log the acknowledgment
  INSERT INTO public.ticket_assignment_history (
    request_id, assigned_to, assignment_type, assignment_reason, acknowledged_at
  ) VALUES (
    ticket_id, auth.uid(), 'manual', 'Ticket acknowledged', NOW()
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update staff availability
CREATE OR REPLACE FUNCTION public.update_staff_availability(new_status TEXT, auto_offline_minutes INTEGER DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate status
  IF new_status NOT IN ('available', 'busy', 'offline', 'on_leave') THEN
    RAISE EXCEPTION 'Invalid availability status';
  END IF;
  
  -- Insert or update availability
  INSERT INTO public.staff_availability (staff_id, availability_status, is_available, last_status_change, auto_offline_at)
  VALUES (
    auth.uid(), 
    new_status, 
    CASE WHEN new_status = 'available' THEN true ELSE false END,
    NOW(),
    CASE WHEN auto_offline_minutes IS NOT NULL THEN NOW() + (auto_offline_minutes || ' minutes')::INTERVAL ELSE NULL END
  )
  ON CONFLICT (staff_id) DO UPDATE SET
    availability_status = EXCLUDED.availability_status,
    is_available = EXCLUDED.is_available,
    last_status_change = EXCLUDED.last_status_change,
    auto_offline_at = EXCLUDED.auto_offline_at,
    updated_at = NOW();
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;