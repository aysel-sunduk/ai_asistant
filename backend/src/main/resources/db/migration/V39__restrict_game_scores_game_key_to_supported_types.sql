DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_game_scores_game_key_supported'
    ) THEN
        ALTER TABLE public.game_scores
        ADD CONSTRAINT chk_game_scores_game_key_supported
        CHECK (game_key IN ('memory', 'quiz', 'sudoku'))
        NOT VALID;
    END IF;
END $$;
