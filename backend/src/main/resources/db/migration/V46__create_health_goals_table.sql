CREATE TABLE IF NOT EXISTS public.health_goals (
    user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    water_ml_target integer NOT NULL DEFAULT 2500 CHECK (water_ml_target > 0),
    steps_target integer NOT NULL DEFAULT 10000 CHECK (steps_target > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_health_goals_updated_at
    ON public.health_goals(updated_at DESC);
