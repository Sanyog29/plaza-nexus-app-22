-- Add length constraints and security improvements

-- Add check constraints for data validation
ALTER TABLE profiles 
ADD CONSTRAINT first_name_length_check CHECK (length(first_name) <= 50),
ADD CONSTRAINT last_name_length_check CHECK (length(last_name) <= 50),
ADD CONSTRAINT phone_number_length_check CHECK (length(phone_number) <= 20),
ADD CONSTRAINT apartment_number_length_check CHECK (length(apartment_number) <= 10);

-- Add constraint for staff role requests
ALTER TABLE staff_role_requests
ADD CONSTRAINT reason_length_check CHECK (length(reason) <= 1000);

-- Add constraint for maintenance requests
ALTER TABLE maintenance_requests
ADD CONSTRAINT title_length_check CHECK (length(title) <= 200),
ADD CONSTRAINT description_length_check CHECK (length(description) <= 5000),
ADD CONSTRAINT location_length_check CHECK (length(location) <= 200);

-- Add constraint for visitor data
ALTER TABLE visitors
ADD CONSTRAINT visitor_name_length_check CHECK (length(name) <= 100),
ADD CONSTRAINT company_length_check CHECK (length(company) <= 100),
ADD CONSTRAINT contact_number_length_check CHECK (length(contact_number) <= 20),
ADD CONSTRAINT visit_purpose_length_check CHECK (length(visit_purpose) <= 500);

-- Add constraint for comments
ALTER TABLE request_comments
ADD CONSTRAINT comment_content_length_check CHECK (length(content) <= 2000);

-- Create function to track sensitive operations for audit logging
CREATE OR REPLACE FUNCTION public.log_sensitive_operation()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes
  IF TG_TABLE_NAME = 'profiles' AND OLD.role != NEW.role THEN
    INSERT INTO public.request_status_history (request_id, status, changed_by, notes)
    VALUES (
      gen_random_uuid(), 
      'completed'::request_status, 
      auth.uid(), 
      'Role changed from ' || OLD.role || ' to ' || NEW.role
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging on profile role changes
CREATE TRIGGER profile_role_change_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.log_sensitive_operation();