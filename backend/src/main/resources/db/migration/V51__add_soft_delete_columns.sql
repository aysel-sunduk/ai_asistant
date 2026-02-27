-- Soft delete support: add deleted_at columns.

ALTER TABLE IF EXISTS public.contacts
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.blog_posts
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.family_transactions
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.family_birthdays
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.goals
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.work_events
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.investments
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.mail_drafts
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.reminders
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.game_scores
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.health_logs
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.shopping_lists
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.shopping_items
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.finance_user_favorite_currencies
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.finance_user_favorite_investments
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.finance_popular_currencies
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.finance_metal_symbols
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.currency_rates_latest
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.investment_recommendations
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE IF EXISTS public.follows
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_contacts_deleted_at ON public.contacts (deleted_at);
CREATE INDEX IF NOT EXISTS idx_family_transactions_deleted_at ON public.family_transactions (deleted_at);
CREATE INDEX IF NOT EXISTS idx_family_birthdays_deleted_at ON public.family_birthdays (deleted_at);
CREATE INDEX IF NOT EXISTS idx_goals_deleted_at ON public.goals (deleted_at);
CREATE INDEX IF NOT EXISTS idx_work_events_deleted_at ON public.work_events (deleted_at);
CREATE INDEX IF NOT EXISTS idx_investments_deleted_at ON public.investments (deleted_at);
CREATE INDEX IF NOT EXISTS idx_mail_drafts_deleted_at ON public.mail_drafts (deleted_at);
CREATE INDEX IF NOT EXISTS idx_reminders_deleted_at ON public.reminders (deleted_at);
CREATE INDEX IF NOT EXISTS idx_game_scores_deleted_at ON public.game_scores (deleted_at);
CREATE INDEX IF NOT EXISTS idx_health_logs_deleted_at ON public.health_logs (deleted_at);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_deleted_at ON public.shopping_lists (deleted_at);
CREATE INDEX IF NOT EXISTS idx_shopping_items_deleted_at ON public.shopping_items (deleted_at);
CREATE INDEX IF NOT EXISTS idx_follows_deleted_at ON public.follows (deleted_at);
