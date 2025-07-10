-- Function to get invitation details for the frontend
CREATE OR REPLACE FUNCTION public.get_invitation_details(token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'email', email,
    'first_name', first_name,
    'last_name', last_name,
    'role', role,
    'department', department,
    'expires_at', expires_at,
    'invited_by', invited_by
  ) INTO invitation_data
  FROM public.user_invitations
  WHERE invitation_token = token
    AND status = 'pending';
  
  RETURN invitation_data;
END;
$$;