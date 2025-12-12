-- Update Neelabh's role to super_tenant
UPDATE user_roles 
SET role = 'super_tenant' 
WHERE user_id = 'c8f407d7-e906-4ef4-86ff-0ca3e85f1d8e';