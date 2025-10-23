-- Promote ranganathanlohitaksha@gmail.com to super_admin role
UPDATE user_roles 
SET role = 'super_admin', 
    assigned_at = now()
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'ranganathanlohitaksha@gmail.com');