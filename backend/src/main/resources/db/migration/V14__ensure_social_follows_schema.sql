-- Ensure social follow table compatibility.

CREATE TABLE IF NOT EXISTS public.follows (
    follower_id uuid NOT NULL,
    following_id uuid NOT NULL,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE IF EXISTS public.follows ADD COLUMN IF NOT EXISTS follower_id uuid;
ALTER TABLE IF EXISTS public.follows ADD COLUMN IF NOT EXISTS following_id uuid;
ALTER TABLE IF EXISTS public.follows ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_follows_following
    ON public.follows (following_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_follows_follower'
    ) THEN
        ALTER TABLE public.follows
        ADD CONSTRAINT fk_follows_follower
        FOREIGN KEY (follower_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_follows_following'
    ) THEN
        ALTER TABLE public.follows
        ADD CONSTRAINT fk_follows_following
        FOREIGN KEY (following_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;
