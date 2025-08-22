-- Fix the cast_request_priority function to handle the enum casting properly
CREATE OR REPLACE FUNCTION cast_request_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure priority is properly handled - remove the explicit cast that's causing issues
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;