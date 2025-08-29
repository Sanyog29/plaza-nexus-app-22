-- Enable real-time updates for maintenance_requests table
ALTER TABLE public.maintenance_requests REPLICA IDENTITY FULL;

-- Add maintenance_requests to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_requests;

-- Also enable for request_workflow_states to track workflow updates
ALTER TABLE public.request_workflow_states REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_workflow_states;