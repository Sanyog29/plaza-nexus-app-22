-- Sync email from auth.users to profiles where profiles.email is NULL
-- This fixes data integrity issue where profiles.email is not populated

UPDATE profiles
SET email = au.email,
    updated_at = NOW()
FROM auth.users au
WHERE profiles.id = au.id
AND profiles.email IS NULL
AND au.email IS NOT NULL;