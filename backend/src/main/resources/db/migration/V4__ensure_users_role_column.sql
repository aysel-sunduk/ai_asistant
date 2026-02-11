-- Ensure users.role exists in all environments and has safe defaults.

ALTER TABLE users
ADD COLUMN IF NOT EXISTS role text;

ALTER TABLE users
ALTER COLUMN role SET DEFAULT 'user';

UPDATE users
SET role = 'user'
WHERE role IS NULL OR trim(role) = '';
