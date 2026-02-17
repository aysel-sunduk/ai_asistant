-- Harden user_profiles identity constraints to guarantee one profile per user.

ALTER TABLE IF EXISTS public.user_profiles
    ADD COLUMN IF NOT EXISTS user_id uuid;

-- Keep the most recent row when historical duplicates exist.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_profiles'
          AND column_name = 'updated_at'
    ) THEN
        DELETE FROM public.user_profiles a
        USING public.user_profiles b
        WHERE a.user_id = b.user_id
          AND a.ctid < b.ctid
          AND COALESCE(a.updated_at, to_timestamp(0)) <= COALESCE(b.updated_at, to_timestamp(0));
    ELSE
        DELETE FROM public.user_profiles a
        USING public.user_profiles b
        WHERE a.user_id = b.user_id
          AND a.ctid < b.ctid;
    END IF;
END $$;

-- Backfill missing user_id from users when possible (best-effort by full_name match is intentionally avoided).
-- Rows still missing user_id are invalid for identity-safe profile operations and will be removed.
DELETE FROM public.user_profiles
WHERE user_id IS NULL;

ALTER TABLE IF EXISTS public.user_profiles
    ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
    -- Add PK only when table has no primary key at all.
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint c
        WHERE c.conrelid = 'public.user_profiles'::regclass
          AND c.contype = 'p'
    ) THEN
        ALTER TABLE public.user_profiles
            ADD CONSTRAINT pk_user_profiles_user_id PRIMARY KEY (user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_user_profiles_user'
    ) THEN
        ALTER TABLE public.user_profiles
            ADD CONSTRAINT fk_user_profiles_user
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;
