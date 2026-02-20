-- Ensure demo users exist, then seed additional leaderboard scores.

INSERT INTO public.users (id, email, password_hash, first_name, last_name, is_email_verified, is_active, visibility, role)
SELECT
    '11111111-1111-1111-1111-111111111111'::uuid,
    'demo.public1@aiasistan.local',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi6M7b8fQ7l2n7Rk5v0zzakDx4zY/9e',
    'Asel',
    'Yildiz',
    true,
    true,
    'public',
    'user'
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = '11111111-1111-1111-1111-111111111111'::uuid
);

INSERT INTO public.users (id, email, password_hash, first_name, last_name, is_email_verified, is_active, visibility, role)
SELECT
    '22222222-2222-2222-2222-222222222222'::uuid,
    'demo.public2@aiasistan.local',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi6M7b8fQ7l2n7Rk5v0zzakDx4zY/9e',
    'Mehmet',
    'Kara',
    true,
    true,
    'public',
    'user'
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = '22222222-2222-2222-2222-222222222222'::uuid
);

INSERT INTO public.users (id, email, password_hash, first_name, last_name, is_email_verified, is_active, visibility, role)
SELECT
    '33333333-3333-3333-3333-333333333333'::uuid,
    'demo.public3@aiasistan.local',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi6M7b8fQ7l2n7Rk5v0zzakDx4zY/9e',
    'Zeynep',
    'Sunduk',
    true,
    true,
    'public',
    'user'
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = '33333333-3333-3333-3333-333333333333'::uuid
);

INSERT INTO public.game_scores (
    id,
    user_id,
    game_key,
    score,
    difficulty,
    duration_sec,
    level,
    metadata,
    played_at
)
VALUES
    ('51000000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'memory', 3580, 'easy',   25, 4, '{"seed":"demo-v43"}'::jsonb, now() - interval '12 hours'),
    ('51000000-0000-0000-0000-000000000002'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'memory', 3340, 'medium', 29, 3, '{"seed":"demo-v43"}'::jsonb, now() - interval '10 hours'),
    ('51000000-0000-0000-0000-000000000003'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'memory', 3010, 'hard',   33, 2, '{"seed":"demo-v43"}'::jsonb, now() - interval '8 hours'),

    ('51000000-0000-0000-0000-000000000004'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'quiz',   12288, 'hard',   214, 6, '{"seed":"demo-v43","rawScore":12288}'::jsonb, now() - interval '12 hours'),
    ('51000000-0000-0000-0000-000000000005'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'quiz',    8192, 'medium', 251, 5, '{"seed":"demo-v43","rawScore":8192}'::jsonb, now() - interval '10 hours'),
    ('51000000-0000-0000-0000-000000000006'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'quiz',    6144, 'medium', 289, 5, '{"seed":"demo-v43","rawScore":6144}'::jsonb, now() - interval '8 hours'),

    ('51000000-0000-0000-0000-000000000007'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, 'sudoku', 3260, 'easy',   61, 2, '{"seed":"demo-v43"}'::jsonb, now() - interval '12 hours'),
    ('51000000-0000-0000-0000-000000000008'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, 'sudoku', 2870, 'medium', 70, 2, '{"seed":"demo-v43"}'::jsonb, now() - interval '10 hours'),
    ('51000000-0000-0000-0000-000000000009'::uuid, '33333333-3333-3333-3333-333333333333'::uuid, 'sudoku', 2510, 'hard',   79, 1, '{"seed":"demo-v43"}'::jsonb, now() - interval '8 hours')
ON CONFLICT (id) DO NOTHING;
