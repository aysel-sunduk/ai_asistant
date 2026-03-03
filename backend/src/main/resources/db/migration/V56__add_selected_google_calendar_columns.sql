ALTER TABLE IF EXISTS public.user_google_calendar_tokens
    ADD COLUMN IF NOT EXISTS selected_calendar_id varchar(255);

ALTER TABLE IF EXISTS public.user_google_calendar_tokens
    ADD COLUMN IF NOT EXISTS selected_calendar_summary varchar(255);
