-- Social graph hardening: private/public profiles and follow request workflow.

ALTER TABLE IF EXISTS public.user_profiles
    ADD COLUMN IF NOT EXISTS profile_visibility varchar(16);

UPDATE public.user_profiles
SET profile_visibility = 'public'
WHERE profile_visibility IS NULL OR length(trim(profile_visibility)) = 0;

ALTER TABLE IF EXISTS public.user_profiles
    ALTER COLUMN profile_visibility SET DEFAULT 'public';

ALTER TABLE IF EXISTS public.user_profiles
    ALTER COLUMN profile_visibility SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_profiles_profile_visibility_allowed'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD CONSTRAINT chk_user_profiles_profile_visibility_allowed
        CHECK (profile_visibility IN ('public', 'private'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.follow_requests (
    requester_id uuid NOT NULL,
    target_id uuid NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (requester_id, target_id)
);

CREATE INDEX IF NOT EXISTS idx_follow_requests_target_status
    ON public.follow_requests (target_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follow_requests_requester_status
    ON public.follow_requests (requester_id, status, created_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_follow_requests_requester'
    ) THEN
        ALTER TABLE public.follow_requests
        ADD CONSTRAINT fk_follow_requests_requester
        FOREIGN KEY (requester_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_follow_requests_target'
    ) THEN
        ALTER TABLE public.follow_requests
        ADD CONSTRAINT fk_follow_requests_target
        FOREIGN KEY (target_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_follow_requests_status_allowed'
    ) THEN
        ALTER TABLE public.follow_requests
        ADD CONSTRAINT chk_follow_requests_status_allowed
        CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_follow_requests_not_self'
    ) THEN
        ALTER TABLE public.follow_requests
        ADD CONSTRAINT chk_follow_requests_not_self
        CHECK (requester_id <> target_id);
    END IF;
END $$;
