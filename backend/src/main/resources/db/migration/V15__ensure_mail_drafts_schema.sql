-- Ensure mail draft module schema compatibility.

CREATE TABLE IF NOT EXISTS public.mail_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    to_email text NOT NULL,
    cc_emails text[],
    bcc_emails text[],
    subject text NOT NULL,
    purpose text,
    tone text,
    language varchar(16) DEFAULT 'tr',
    key_points jsonb,
    draft_content text,
    status varchar(32) DEFAULT 'draft',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS to_email text;
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS cc_emails text[];
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS bcc_emails text[];
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS purpose text;
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS tone text;
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS language varchar(16) DEFAULT 'tr';
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS key_points jsonb;
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS draft_content text;
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS status varchar(32) DEFAULT 'draft';
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS public.mail_drafts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.mail_drafts
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_mail_drafts_user_updated
    ON public.mail_drafts (user_id, updated_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_mail_drafts_user'
    ) THEN
        ALTER TABLE public.mail_drafts
        ADD CONSTRAINT fk_mail_drafts_user
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;
