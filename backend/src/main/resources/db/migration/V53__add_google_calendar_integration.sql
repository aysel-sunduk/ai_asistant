CREATE TABLE IF NOT EXISTS public.user_google_calendar_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    token_type varchar(64),
    scope text,
    expires_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    CONSTRAINT fk_user_google_calendar_tokens_user
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_google_calendar_tokens_user_id
    ON public.user_google_calendar_tokens (user_id)
    WHERE deleted_at IS NULL;

ALTER TABLE IF EXISTS public.reminders
    ADD COLUMN IF NOT EXISTS google_calendar_event_id varchar(255);

ALTER TABLE IF EXISTS public.work_events
    ADD COLUMN IF NOT EXISTS google_calendar_event_id varchar(255);

ALTER TABLE IF EXISTS public.family_birthdays
    ADD COLUMN IF NOT EXISTS google_calendar_event_id varchar(255);
