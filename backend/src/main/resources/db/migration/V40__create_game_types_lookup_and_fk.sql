CREATE TABLE IF NOT EXISTS public.game_types (
    game_key text PRIMARY KEY,
    display_name text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    sort_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.game_types (game_key, display_name, is_active, sort_order)
VALUES
    ('memory', 'Hafiza', true, 1),
    ('quiz', 'Quiz', true, 2),
    ('sudoku', 'Sudoku', true, 3)
ON CONFLICT (game_key) DO UPDATE
SET
    display_name = EXCLUDED.display_name,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    updated_at = now();

CREATE INDEX IF NOT EXISTS idx_game_types_active_sort
    ON public.game_types (is_active, sort_order, game_key);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_game_scores_game_type'
    ) THEN
        ALTER TABLE public.game_scores
        ADD CONSTRAINT fk_game_scores_game_type
        FOREIGN KEY (game_key)
        REFERENCES public.game_types (game_key)
        NOT VALID;
    END IF;
END $$;
