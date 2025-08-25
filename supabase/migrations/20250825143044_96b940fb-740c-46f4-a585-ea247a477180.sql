-- Add unique constraint to request_workflow_states.request_id
-- This is required for the ON CONFLICT clause in the update_workflow_state trigger
ALTER TABLE public.request_workflow_states 
ADD CONSTRAINT request_workflow_states_request_id_key UNIQUE (request_id);