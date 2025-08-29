-- Add unique constraint on request_id to fix ON CONFLICT issue
ALTER TABLE request_workflow_states 
ADD CONSTRAINT request_workflow_states_request_id_unique UNIQUE (request_id);

-- Ensure the table has proper indexing for performance
CREATE INDEX IF NOT EXISTS idx_request_workflow_states_technician_id 
ON request_workflow_states(technician_id);

CREATE INDEX IF NOT EXISTS idx_request_workflow_states_current_stage 
ON request_workflow_states(current_stage);