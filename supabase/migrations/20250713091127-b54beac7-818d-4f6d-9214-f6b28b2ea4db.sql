-- Create a feedback table for maintenance requests
CREATE TABLE public.maintenance_request_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL,
  user_id UUID NOT NULL,
  satisfaction_rating INTEGER NOT NULL CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  response_time_rating INTEGER CHECK (response_time_rating >= 1 AND response_time_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  feedback_text TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_request_feedback UNIQUE(request_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.maintenance_request_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies for feedback access
CREATE POLICY "Users can create feedback for their own requests" 
ON public.maintenance_request_feedback 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  EXISTS (
    SELECT 1 FROM public.maintenance_requests 
    WHERE id = request_id AND reported_by = auth.uid() AND status = 'completed'
  )
);

CREATE POLICY "Users can view their own feedback" 
ON public.maintenance_request_feedback 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all feedback" 
ON public.maintenance_request_feedback 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "Users can update their own feedback" 
ON public.maintenance_request_feedback 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add foreign key constraints
ALTER TABLE public.maintenance_request_feedback 
ADD CONSTRAINT maintenance_request_feedback_request_id_fkey 
FOREIGN KEY (request_id) REFERENCES public.maintenance_requests(id) ON DELETE CASCADE;

-- Create trigger for updated_at
CREATE TRIGGER update_maintenance_request_feedback_updated_at
BEFORE UPDATE ON public.maintenance_request_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_maintenance_request_feedback_request_id ON public.maintenance_request_feedback(request_id);
CREATE INDEX idx_maintenance_request_feedback_user_id ON public.maintenance_request_feedback(user_id);