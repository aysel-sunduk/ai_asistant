-- Enforce business constraints for newly added modules.

-- health_logs log_type and required fields constraints.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_health_logs_log_type_allowed'
    ) THEN
        ALTER TABLE public.health_logs
        ADD CONSTRAINT chk_health_logs_log_type_allowed
        CHECK (log_type IN ('daily_summary', 'water', 'exercise', 'meal'));
    END IF;
END $$;

-- goals constraints.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_goals_progress_range'
    ) THEN
        ALTER TABLE public.goals
        ADD CONSTRAINT chk_goals_progress_range
        CHECK (progress_pct BETWEEN 0 AND 100);
    END IF;
END $$;

-- blog constraints.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_blog_posts_visibility_allowed'
    ) THEN
        ALTER TABLE public.blog_posts
        ADD CONSTRAINT chk_blog_posts_visibility_allowed
        CHECK (visibility IN ('private', 'followers', 'public'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_blog_posts_status_allowed'
    ) THEN
        ALTER TABLE public.blog_posts
        ADD CONSTRAINT chk_blog_posts_status_allowed
        CHECK (status IN ('draft', 'published', 'archived'));
    END IF;
END $$;

-- shopping constraints.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shopping_items') THEN
        UPDATE public.shopping_items
        SET quantity = 1
        WHERE quantity IS NULL OR quantity < 1;

        UPDATE public.shopping_items
        SET estimated_price_minor = 0
        WHERE estimated_price_minor < 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_shopping_items_quantity_positive'
    ) THEN
        ALTER TABLE public.shopping_items
        ADD CONSTRAINT chk_shopping_items_quantity_positive
        CHECK (quantity >= 1);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_shopping_items_price_non_negative'
    ) THEN
        ALTER TABLE public.shopping_items
        ADD CONSTRAINT chk_shopping_items_price_non_negative
        CHECK (estimated_price_minor IS NULL OR estimated_price_minor >= 0);
    END IF;
END $$;

-- game score constraints.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'game_scores') THEN
        UPDATE public.game_scores
        SET score = 0
        WHERE score < 0;

        UPDATE public.game_scores
        SET duration_sec = 0
        WHERE duration_sec < 0;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_game_scores_score_non_negative'
    ) THEN
        ALTER TABLE public.game_scores
        ADD CONSTRAINT chk_game_scores_score_non_negative
        CHECK (score >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_game_scores_duration_non_negative'
    ) THEN
        ALTER TABLE public.game_scores
        ADD CONSTRAINT chk_game_scores_duration_non_negative
        CHECK (duration_sec IS NULL OR duration_sec >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_game_scores_difficulty_allowed'
    ) THEN
        ALTER TABLE public.game_scores
        ADD CONSTRAINT chk_game_scores_difficulty_allowed
        CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard'));
    END IF;
END $$;

-- follows self-follow block.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_follows_not_self'
    ) THEN
        ALTER TABLE public.follows
        ADD CONSTRAINT chk_follows_not_self
        CHECK (follower_id <> following_id);
    END IF;
END $$;

-- mail draft constraints.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_mail_drafts_language_allowed'
    ) THEN
        ALTER TABLE public.mail_drafts
        ADD CONSTRAINT chk_mail_drafts_language_allowed
        CHECK (language IN ('tr', 'en'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_mail_drafts_status_allowed'
    ) THEN
        ALTER TABLE public.mail_drafts
        ADD CONSTRAINT chk_mail_drafts_status_allowed
        CHECK (status IN ('draft', 'ready', 'sent', 'archived'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_mail_drafts_required_subject_to'
    ) THEN
        ALTER TABLE public.mail_drafts
        ADD CONSTRAINT chk_mail_drafts_required_subject_to
        CHECK (length(trim(to_email)) > 0 AND length(trim(subject)) > 0);
    END IF;
END $$;
