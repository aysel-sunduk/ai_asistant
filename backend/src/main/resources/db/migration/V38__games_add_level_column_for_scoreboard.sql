ALTER TABLE IF EXISTS public.game_scores
ADD COLUMN IF NOT EXISTS level int;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_game_scores_level_positive'
    ) THEN
        ALTER TABLE public.game_scores
        ADD CONSTRAINT chk_game_scores_level_positive
        CHECK (level IS NULL OR level >= 1);
    END IF;
END $$;

UPDATE public.game_scores
SET level = NULLIF(regexp_replace(metadata->>'level', '[^0-9]', '', 'g'), '')::int
WHERE level IS NULL
  AND metadata IS NOT NULL
  AND metadata ? 'level'
  AND NULLIF(regexp_replace(metadata->>'level', '[^0-9]', '', 'g'), '') IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_game_scores_user_game_played_at
    ON public.game_scores (user_id, game_key, played_at DESC);
