-- Ensure schema compatibility for newly added module endpoints.
-- 1) health_logs table and required columns for health endpoints.
CREATE TABLE IF NOT EXISTS public.health_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    log_type varchar(64) NOT NULL,
    log_date date NOT NULL DEFAULT CURRENT_DATE,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    logged_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE IF EXISTS public.health_logs ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE IF EXISTS public.health_logs ADD COLUMN IF NOT EXISTS log_type varchar(64);
ALTER TABLE IF EXISTS public.health_logs ADD COLUMN IF NOT EXISTS log_date date DEFAULT CURRENT_DATE;
ALTER TABLE IF EXISTS public.health_logs ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS public.health_logs ADD COLUMN IF NOT EXISTS logged_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_health_logs_user_date
    ON public.health_logs (user_id, log_date, log_type);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_health_logs_user'
    ) THEN
        ALTER TABLE public.health_logs
        ADD CONSTRAINT fk_health_logs_user
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2) goals table compatibility.
CREATE TABLE IF NOT EXISTS public.goals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    target_date date,
    progress_pct int DEFAULT 0,
    is_completed boolean DEFAULT false,
    milestones jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS public.goals ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE IF EXISTS public.goals ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE IF EXISTS public.goals ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE IF EXISTS public.goals ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE IF EXISTS public.goals ADD COLUMN IF NOT EXISTS target_date date;
ALTER TABLE IF EXISTS public.goals ADD COLUMN IF NOT EXISTS progress_pct int DEFAULT 0;
ALTER TABLE IF EXISTS public.goals ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false;
ALTER TABLE IF EXISTS public.goals ADD COLUMN IF NOT EXISTS milestones jsonb DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.goals ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS public.goals ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_goals_user
    ON public.goals (user_id, is_completed);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_goals_user'
    ) THEN
        ALTER TABLE public.goals
        ADD CONSTRAINT fk_goals_user
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3) blog_posts table compatibility.
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    raw_content text NOT NULL,
    clean_content text,
    visibility varchar(32) DEFAULT 'private',
    status text DEFAULT 'draft',
    tags text[],
    like_count int DEFAULT 0,
    comments jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS raw_content text;
ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS clean_content text;
ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS visibility varchar(32) DEFAULT 'private';
ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS like_count int DEFAULT 0;
ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS comments jsonb DEFAULT '[]'::jsonb;
ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS public.blog_posts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_blog_posts_user
    ON public.blog_posts (user_id, created_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_blog_posts_user'
    ) THEN
        ALTER TABLE public.blog_posts
        ADD CONSTRAINT fk_blog_posts_user
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4) shopping lists/items compatibility.
CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL DEFAULT 'Alisveris Listem',
    is_archived boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS public.shopping_lists ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE IF EXISTS public.shopping_lists ADD COLUMN IF NOT EXISTS name text DEFAULT 'Alisveris Listem';
ALTER TABLE IF EXISTS public.shopping_lists ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;
ALTER TABLE IF EXISTS public.shopping_lists ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_archived
    ON public.shopping_lists (user_id, is_archived);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_shopping_lists_user'
    ) THEN
        ALTER TABLE public.shopping_lists
        ADD CONSTRAINT fk_shopping_lists_user
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.shopping_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id uuid NOT NULL,
    name text NOT NULL,
    quantity int DEFAULT 1,
    unit text,
    estimated_price_minor bigint,
    is_checked boolean DEFAULT false,
    note text
);

ALTER TABLE IF EXISTS public.shopping_items ADD COLUMN IF NOT EXISTS list_id uuid;
ALTER TABLE IF EXISTS public.shopping_items ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE IF EXISTS public.shopping_items ADD COLUMN IF NOT EXISTS quantity int DEFAULT 1;
ALTER TABLE IF EXISTS public.shopping_items ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE IF EXISTS public.shopping_items ADD COLUMN IF NOT EXISTS estimated_price_minor bigint;
ALTER TABLE IF EXISTS public.shopping_items ADD COLUMN IF NOT EXISTS is_checked boolean DEFAULT false;
ALTER TABLE IF EXISTS public.shopping_items ADD COLUMN IF NOT EXISTS note text;

CREATE INDEX IF NOT EXISTS idx_shopping_items_list
    ON public.shopping_items (list_id, is_checked);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_shopping_items_list'
    ) THEN
        ALTER TABLE public.shopping_items
        ADD CONSTRAINT fk_shopping_items_list
        FOREIGN KEY (list_id) REFERENCES public.shopping_lists(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5) game_scores table compatibility.
CREATE TABLE IF NOT EXISTS public.game_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    game_key text NOT NULL,
    score int NOT NULL,
    difficulty text,
    duration_sec int,
    metadata jsonb,
    played_at timestamptz DEFAULT now()
);

ALTER TABLE IF EXISTS public.game_scores ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE IF EXISTS public.game_scores ADD COLUMN IF NOT EXISTS game_key text;
ALTER TABLE IF EXISTS public.game_scores ADD COLUMN IF NOT EXISTS score int;
ALTER TABLE IF EXISTS public.game_scores ADD COLUMN IF NOT EXISTS difficulty text;
ALTER TABLE IF EXISTS public.game_scores ADD COLUMN IF NOT EXISTS duration_sec int;
ALTER TABLE IF EXISTS public.game_scores ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE IF EXISTS public.game_scores ADD COLUMN IF NOT EXISTS played_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_game_scores_leaderboard
    ON public.game_scores (game_key, score DESC);

CREATE INDEX IF NOT EXISTS idx_game_scores_user
    ON public.game_scores (user_id, played_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_game_scores_user'
    ) THEN
        ALTER TABLE public.game_scores
        ADD CONSTRAINT fk_game_scores_user
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;
