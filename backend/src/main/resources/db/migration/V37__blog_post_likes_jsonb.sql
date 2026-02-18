ALTER TABLE IF EXISTS public.blog_posts
    ADD COLUMN IF NOT EXISTS liked_user_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.blog_posts
SET liked_user_ids = '[]'::jsonb
WHERE liked_user_ids IS NULL;
