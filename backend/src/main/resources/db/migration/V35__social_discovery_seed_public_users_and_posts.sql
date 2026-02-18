ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS visibility varchar(16);

ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS first_name text;

ALTER TABLE IF EXISTS public.users
    ADD COLUMN IF NOT EXISTS last_name text;

UPDATE public.users
SET visibility = 'public'
WHERE visibility IS NULL OR length(trim(visibility)) = 0;

UPDATE public.users
SET first_name = COALESCE(first_name, '')
WHERE first_name IS NULL;

UPDATE public.users
SET last_name = COALESCE(last_name, '')
WHERE last_name IS NULL;

ALTER TABLE IF EXISTS public.users
    ALTER COLUMN visibility SET DEFAULT 'public';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_visibility_allowed'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT chk_users_visibility_allowed
            CHECK (visibility IN ('public', 'private'));
    END IF;
END $$;

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
    SELECT 1 FROM public.users WHERE email = 'demo.public1@aiasistan.local'
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
    SELECT 1 FROM public.users WHERE email = 'demo.public2@aiasistan.local'
);

INSERT INTO public.users (id, email, password_hash, first_name, last_name, is_email_verified, is_active, visibility, role)
SELECT
    '33333333-3333-3333-3333-333333333333'::uuid,
    'demo.public3@aiasistan.local',
    '$2a$10$7EqJtq98hPqEX7fNZaFWoOHi6M7b8fQ7l2n7Rk5v0zzakDx4zY/9e',
    'Zeynep',
    'Demir',
    true,
    true,
    'public',
    'user'
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE email = 'demo.public3@aiasistan.local'
);

INSERT INTO public.blog_posts (
    id,
    user_id,
    title,
    raw_content,
    clean_content,
    visibility,
    status,
    tags,
    like_count,
    comments
)
SELECT
    gen_random_uuid(),
    u.id,
    p.title,
    p.raw_content,
    p.clean_content,
    'public',
    'published',
    p.tags,
    p.like_count,
    '[]'::jsonb
FROM (
    VALUES
        ('demo.public1@aiasistan.local', 'Sprint sonrasi ogrenilenler', 'Bugunku sprint review sonrasinda ekip ici iletisim ve scope netligi konularinda guzel kazanimlar cikardik.', 'Bugunku sprint review sonrasinda ekip ici iletisim ve scope netligi konularinda guzel kazanimlar cikardik.', ARRAY['is','ekip']::text[], 12),
        ('demo.public2@aiasistan.local', 'Toplanti notu alma rutini', 'Her toplanti icin tek sayfa not + aksiyon listesi yontemi verimliligi ciddi artirdi.', 'Her toplanti icin tek sayfa not + aksiyon listesi yontemi verimliligi ciddi artirdi.', ARRAY['verimlilik','toplanti']::text[], 8),
        ('demo.public3@aiasistan.local', 'Haftalik planlama mini rehberi', 'Pazartesi sabah 20 dakikalik haftalik planlama, gun ici daginikligi azaltiyor.', 'Pazartesi sabah 20 dakikalik haftalik planlama, gun ici daginikligi azaltiyor.', ARRAY['planlama','kariyer']::text[], 5)
) AS p(email, title, raw_content, clean_content, tags, like_count)
JOIN public.users u ON u.email = p.email
WHERE NOT EXISTS (
    SELECT 1
    FROM public.blog_posts b
    WHERE b.user_id = u.id
      AND b.title = p.title
);
