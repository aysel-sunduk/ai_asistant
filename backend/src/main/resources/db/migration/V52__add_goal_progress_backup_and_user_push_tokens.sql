ALTER TABLE IF EXISTS public.goals
    ADD COLUMN IF NOT EXISTS progress_pct_before_completion int;

CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    token varchar(255) NOT NULL,
    platform varchar(64),
    device_id varchar(128),
    is_active boolean NOT NULL DEFAULT true,
    last_seen_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT fk_user_push_tokens_user
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_push_tokens_token
    ON public.user_push_tokens (token);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id
    ON public.user_push_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active
    ON public.user_push_tokens (user_id, is_active)
    WHERE deleted_at IS NULL;
