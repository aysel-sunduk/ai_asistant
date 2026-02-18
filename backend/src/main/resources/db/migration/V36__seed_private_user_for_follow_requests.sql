INSERT INTO public.users (id, email, password_hash, first_name, last_name, is_email_verified, is_active, visibility, role)
SELECT
    '44444444-4444-4444-4444-444444444444'::uuid,
    'demo.private1@aiasistan.local',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi6M7b8fQ7l2n7Rk5v0zzakDx4zY/9e',
    'Gizem',
    'Ozel',
    true,
    true,
    'private',
    'user'
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'demo.private1@aiasistan.local'
);
