-- Create loyalty points system and enhanced attachment tracking

-- Loyalty Points System
CREATE TABLE public.technician_points (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points_earned integer NOT NULL DEFAULT 0,
  points_spent integer NOT NULL DEFAULT 0,
  points_balance integer NOT NULL DEFAULT 0,
  current_tier text NOT NULL DEFAULT 'bronze',
  total_lifetime_points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.point_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.maintenance_requests(id) ON DELETE SET NULL,
  transaction_type text NOT NULL, -- 'earned', 'spent', 'bonus', 'penalty'
  points integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.point_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  points_required integer NOT NULL,
  reward_type text NOT NULL, -- 'voucher', 'day_off', 'cash', 'gift'
  reward_value text,
  is_active boolean NOT NULL DEFAULT true,
  stock_quantity integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.point_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.point_rewards(id),
  points_spent integer NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'fulfilled', 'cancelled'
  redemption_code text,
  redeemed_at timestamp with time zone NOT NULL DEFAULT now(),
  fulfilled_at timestamp with time zone,
  fulfilled_by uuid REFERENCES public.profiles(id)
);

-- Enhanced attachment tracking with before/after workflow
ALTER TABLE public.request_attachments 
ADD COLUMN attachment_type text DEFAULT 'user_upload', -- 'user_upload', 'technician_before', 'technician_after'
ADD COLUMN stage text DEFAULT 'initial', -- 'initial', 'in_progress', 'completed'
ADD COLUMN metadata jsonb DEFAULT '{}';

-- Create workflow state tracking table
CREATE TABLE public.request_workflow_states (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.maintenance_requests(id) ON DELETE CASCADE,
  current_stage text NOT NULL DEFAULT 'pending', -- 'pending', 'assigned', 'in_progress', 'completed'
  before_photos_required boolean NOT NULL DEFAULT true,
  after_photos_required boolean NOT NULL DEFAULT true,
  before_photos_uploaded boolean NOT NULL DEFAULT false,
  after_photos_uploaded boolean NOT NULL DEFAULT false,
  technician_id uuid REFERENCES public.profiles(id),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create leaderboard view for monthly rankings
CREATE OR REPLACE VIEW public.monthly_leaderboard AS
SELECT 
  p.id,
  CONCAT(p.first_name, ' ', p.last_name) as technician_name,
  p.avatar_url,
  p.department,
  tp.current_tier,
  COALESCE(SUM(pt.points) FILTER (WHERE pt.created_at >= date_trunc('month', now())), 0) as monthly_points,
  tp.points_balance as total_points,
  COUNT(mr.id) FILTER (WHERE mr.completed_at >= date_trunc('month', now())) as tickets_completed,
  COALESCE(AVG(EXTRACT(EPOCH FROM (mr.completed_at - mr.created_at))/3600) FILTER (WHERE mr.completed_at >= date_trunc('month', now())), 0) as avg_completion_hours
FROM public.profiles p
LEFT JOIN public.technician_points tp ON p.id = tp.technician_id
LEFT JOIN public.point_transactions pt ON p.id = pt.technician_id AND pt.transaction_type = 'earned'
LEFT JOIN public.maintenance_requests mr ON p.id = mr.assigned_to AND mr.status = 'completed'
WHERE p.role IN ('field_staff', 'ops_supervisor')
GROUP BY p.id, p.first_name, p.last_name, p.avatar_url, p.department, tp.current_tier, tp.points_balance
ORDER BY monthly_points DESC, tickets_completed DESC;

-- Function to calculate and award points for completed tickets
CREATE OR REPLACE FUNCTION public.award_completion_points()
RETURNS TRIGGER AS $$
DECLARE
  base_points integer := 10;
  priority_multiplier numeric := 1.0;
  speed_bonus integer := 0;
  quality_bonus integer := 0;
  total_points integer;
  completion_hours numeric;
  expected_hours numeric;
BEGIN
  -- Only award points when status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Calculate completion time in hours
    completion_hours := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.created_at))/3600;
    
    -- Set expected hours based on priority
    expected_hours := CASE NEW.priority
      WHEN 'urgent' THEN 2
      WHEN 'high' THEN 8
      WHEN 'medium' THEN 24
      WHEN 'low' THEN 72
      ELSE 24
    END;
    
    -- Priority multipliers
    priority_multiplier := CASE NEW.priority
      WHEN 'urgent' THEN 3.0
      WHEN 'high' THEN 2.0
      WHEN 'medium' THEN 1.5
      WHEN 'low' THEN 1.0
      ELSE 1.0
    END;
    
    -- Speed bonus for completing within expected time
    IF completion_hours <= expected_hours THEN
      speed_bonus := ROUND(base_points * 0.5);
    END IF;
    
    -- Quality bonus (check if before/after photos are uploaded)
    SELECT CASE 
      WHEN before_photos_uploaded AND after_photos_uploaded THEN ROUND(base_points * 0.3)
      ELSE 0
    END INTO quality_bonus
    FROM public.request_workflow_states 
    WHERE request_id = NEW.id;
    
    -- Calculate total points
    total_points := ROUND(base_points * priority_multiplier) + speed_bonus + COALESCE(quality_bonus, 0);
    
    -- Award points if technician is assigned
    IF NEW.assigned_to IS NOT NULL THEN
      -- Insert point transaction
      INSERT INTO public.point_transactions (
        technician_id, 
        request_id, 
        transaction_type, 
        points, 
        reason,
        metadata
      ) VALUES (
        NEW.assigned_to,
        NEW.id,
        'earned',
        total_points,
        'Ticket completion',
        jsonb_build_object(
          'base_points', base_points,
          'priority_multiplier', priority_multiplier,
          'speed_bonus', speed_bonus,
          'quality_bonus', COALESCE(quality_bonus, 0),
          'completion_hours', completion_hours,
          'expected_hours', expected_hours
        )
      );
      
      -- Update technician points balance
      INSERT INTO public.technician_points (technician_id, points_earned, points_balance, total_lifetime_points)
      VALUES (NEW.assigned_to, total_points, total_points, total_points)
      ON CONFLICT (technician_id) DO UPDATE SET
        points_earned = technician_points.points_earned + total_points,
        points_balance = technician_points.points_balance + total_points,
        total_lifetime_points = technician_points.total_lifetime_points + total_points,
        current_tier = CASE 
          WHEN technician_points.total_lifetime_points + total_points >= 1000 THEN 'gold'
          WHEN technician_points.total_lifetime_points + total_points >= 500 THEN 'silver'
          ELSE 'bronze'
        END,
        updated_at = now();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to award points on ticket completion
CREATE TRIGGER award_points_on_completion
  AFTER UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.award_completion_points();

-- Function to track workflow state changes
CREATE OR REPLACE FUNCTION public.update_workflow_state()
RETURNS TRIGGER AS $$
BEGIN
  -- Create or update workflow state when request is assigned
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to != NEW.assigned_to) THEN
    INSERT INTO public.request_workflow_states (request_id, technician_id, current_stage)
    VALUES (NEW.id, NEW.assigned_to, 'assigned')
    ON CONFLICT (request_id) DO UPDATE SET
      technician_id = NEW.assigned_to,
      current_stage = 'assigned',
      updated_at = now();
  END IF;
  
  -- Update stage when status changes
  IF NEW.status != COALESCE(OLD.status, 'pending') THEN
    UPDATE public.request_workflow_states
    SET current_stage = CASE 
      WHEN NEW.status = 'in_progress' THEN 'in_progress'
      WHEN NEW.status = 'completed' THEN 'completed'
      ELSE current_stage
    END,
    started_at = CASE WHEN NEW.status = 'in_progress' AND started_at IS NULL THEN now() ELSE started_at END,
    completed_at = CASE WHEN NEW.status = 'completed' THEN now() ELSE completed_at END,
    updated_at = now()
    WHERE request_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update workflow states
CREATE TRIGGER update_workflow_state_trigger
  AFTER INSERT OR UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_workflow_state();

-- Function to check photo upload requirements
CREATE OR REPLACE FUNCTION public.update_photo_upload_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update workflow state when before/after photos are uploaded
  IF NEW.attachment_type IN ('technician_before', 'technician_after') THEN
    UPDATE public.request_workflow_states
    SET before_photos_uploaded = CASE 
      WHEN NEW.attachment_type = 'technician_before' THEN true
      ELSE before_photos_uploaded
    END,
    after_photos_uploaded = CASE 
      WHEN NEW.attachment_type = 'technician_after' THEN true
      ELSE after_photos_uploaded
    END,
    updated_at = now()
    WHERE request_id = NEW.request_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update photo status
CREATE TRIGGER update_photo_status_trigger
  AFTER INSERT ON public.request_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_photo_upload_status();

-- Enable RLS on new tables
ALTER TABLE public.technician_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_workflow_states ENABLE ROW LEVEL SECURITY;

-- RLS Policies for technician_points
CREATE POLICY "Technicians can view their own points"
ON public.technician_points FOR SELECT
USING (technician_id = auth.uid() OR is_staff(auth.uid()));

CREATE POLICY "System can manage points"
ON public.technician_points FOR ALL
USING (is_admin(auth.uid()));

-- RLS Policies for point_transactions
CREATE POLICY "Users can view their own transactions"
ON public.point_transactions FOR SELECT
USING (technician_id = auth.uid() OR is_staff(auth.uid()));

CREATE POLICY "System can create transactions"
ON public.point_transactions FOR INSERT
WITH CHECK (is_staff(auth.uid()));

-- RLS Policies for point_rewards
CREATE POLICY "Everyone can view active rewards"
ON public.point_rewards FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage rewards"
ON public.point_rewards FOR ALL
USING (is_admin(auth.uid()));

-- RLS Policies for point_redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.point_redemptions FOR SELECT
USING (technician_id = auth.uid() OR is_staff(auth.uid()));

CREATE POLICY "Users can create redemptions"
ON public.point_redemptions FOR INSERT
WITH CHECK (technician_id = auth.uid());

-- RLS Policies for request_workflow_states
CREATE POLICY "Staff can view workflow states"
ON public.request_workflow_states FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "System can manage workflow states"
ON public.request_workflow_states FOR ALL
USING (is_staff(auth.uid()));

-- Insert default rewards
INSERT INTO public.point_rewards (title, description, points_required, reward_type, reward_value, stock_quantity) VALUES
('Coffee Voucher', '₹100 coffee shop voucher', 50, 'voucher', '100', 50),
('Lunch Voucher', '₹300 restaurant voucher', 150, 'voucher', '300', 30),
('Half Day Off', 'Extra half day leave', 300, 'day_off', '0.5', 20),
('Full Day Off', 'Extra full day leave', 500, 'day_off', '1', 10),
('Tech Gadget', 'Bluetooth earphones or power bank', 800, 'gift', 'tech_gadget', 5),
('Cash Bonus', '₹1000 cash bonus', 1000, 'cash', '1000', 5);