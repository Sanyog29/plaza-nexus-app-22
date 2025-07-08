-- Add RLS policies for controlled deletion of maintenance requests
-- Only allow deletion of pending requests by the reporter or staff

-- Policy for users to delete their own pending requests
CREATE POLICY "Users can delete their own pending requests" 
ON maintenance_requests 
FOR DELETE 
USING (
  auth.uid() = reported_by 
  AND status = 'pending'
);

-- Policy for staff to delete any pending requests
CREATE POLICY "Staff can delete pending requests" 
ON maintenance_requests 
FOR DELETE 
USING (
  is_staff(auth.uid()) 
  AND status = 'pending'
);

-- Add training module for Data Management & Deletion Procedures
INSERT INTO knowledge_base_articles (
  title,
  content,
  category,
  difficulty,
  estimated_time_minutes,
  steps,
  required_tools,
  safety_warnings,
  tags
) VALUES (
  'Data Management & Deletion Procedures',
  'Learn proper procedures for managing and deleting maintenance requests, including when deletion is appropriate and data retention policies.',
  'compliance',
  'intermediate',
  25,
  '[
    {
      "step": 1,
      "title": "Understanding Request Lifecycle",
      "description": "Learn the different stages of maintenance requests and when deletion is appropriate.",
      "details": "Requests can only be deleted when in pending status. Once work begins, requests should be cancelled rather than deleted to maintain audit trail."
    },
    {
      "step": 2,
      "title": "Deletion Authorization",
      "description": "Understand who can delete requests and under what circumstances.",
      "details": "Users can delete their own pending requests. Staff can delete any pending request with proper justification."
    },
    {
      "step": 3,
      "title": "Data Backup Procedures",
      "description": "Always backup important data before deletion.",
      "details": "Export request details and attachments before permanent deletion. Follow company data retention policies."
    },
    {
      "step": 4,
      "title": "Audit Trail Maintenance",
      "description": "Ensure proper documentation of deletion activities.",
      "details": "Log all deletion activities with reason codes. Maintain records as per compliance requirements."
    }
  ]'::jsonb,
  ARRAY['data management', 'deletion', 'audit trail', 'compliance'],
  ARRAY['Always backup before deletion', 'Verify deletion authorization', 'Document all deletion activities'],
  ARRAY['backup', 'compliance', 'data management', 'audit']
);