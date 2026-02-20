-- Seed extra demo game scores so leaderboard has multiple players.
-- This migration is safe to rerun manually because of ON CONFLICT(id) DO NOTHING.

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
SELECT
    s.id,
    u.id,
    s.game_key,
    s.score,
    s.difficulty,
    s.duration_sec,
    s.level,
    s.metadata,
    s.played_at
FROM (
    VALUES
        ('50000000-0000-0000-0000-000000000001'::uuid, 'demo.public1@aiasistan.local', 'memory', 3450, 'easy',   27, 3, '{"seed":"demo"}'::jsonb, now() - interval '3 days'),
        ('50000000-0000-0000-0000-000000000002'::uuid, 'demo.public2@aiasistan.local', 'memory', 3120, 'medium', 31, 3, '{"seed":"demo"}'::jsonb, now() - interval '2 days'),
        ('50000000-0000-0000-0000-000000000003'::uuid, 'demo.public3@aiasistan.local', 'memory', 2890, 'hard',   36, 2, '{"seed":"demo"}'::jsonb, now() - interval '1 day'),

        ('50000000-0000-0000-0000-000000000004'::uuid, 'demo.public1@aiasistan.local', 'quiz',   8192, 'medium', 246, 5, '{"seed":"demo","rawScore":8192}'::jsonb, now() - interval '3 days'),
        ('50000000-0000-0000-0000-000000000005'::uuid, 'demo.public2@aiasistan.local', 'quiz',   6144, 'medium', 279, 4, '{"seed":"demo","rawScore":6144}'::jsonb, now() - interval '2 days'),
        ('50000000-0000-0000-0000-000000000006'::uuid, 'demo.public3@aiasistan.local', 'quiz',   4096, 'hard',   315, 4, '{"seed":"demo","rawScore":4096}'::jsonb, now() - interval '1 day'),

        ('50000000-0000-0000-0000-000000000007'::uuid, 'demo.public1@aiasistan.local', 'sudoku', 2980, 'easy',   67,  2, '{"seed":"demo"}'::jsonb, now() - interval '3 days'),
        ('50000000-0000-0000-0000-000000000008'::uuid, 'demo.public2@aiasistan.local', 'sudoku', 2640, 'medium', 76,  2, '{"seed":"demo"}'::jsonb, now() - interval '2 days'),
        ('50000000-0000-0000-0000-000000000009'::uuid, 'demo.public3@aiasistan.local', 'sudoku', 2390, 'hard',   84,  1, '{"seed":"demo"}'::jsonb, now() - interval '1 day')
) AS s(id, email, game_key, score, difficulty, duration_sec, level, metadata, played_at)
JOIN public.users u ON u.email = s.email
ON CONFLICT (id) DO NOTHING;
